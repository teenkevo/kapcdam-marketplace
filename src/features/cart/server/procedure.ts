import { TRPCError } from "@trpc/server";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { z } from "zod";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import {
  CartSchema,
  addToCartSchema,
  updateCartItemSchema,
  syncCartSchema,
  CartDisplayCourseType,
  CartDisplayProductType,
} from "../schema";
import { CART_DISPLAY_QUERY, CART_ITEMS_QUERY } from "./query";
import { sanityFetch } from "@/sanity/lib/live";

export const cartRouter = createTRPCRouter({
  /**
   * Get the authenticated user's "forever cart"
   */
  getUserCart: protectedProcedure.query(async ({ ctx }) => {
    try {
      const cart = await client.fetch(CART_ITEMS_QUERY, {
        clerkUserId: ctx.auth.userId,
      });

      if (!cart) {
        return null;
      }

      console.log("cart", cart);

      return CartSchema.parse(cart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Schema validation error:", error.errors);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid cart data structure",
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch cart",
      });
    }
  }),

  /**
   * Add item to authenticated user's "forever cart"
   * Cart should already exist (created via Clerk webhook)
   */
  addToCart: protectedProcedure
    .input(addToCartSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const {
          type,
          productId,
          courseId,
          selectedVariantSku,
          quantity,
          preferredStartDate,
        } = input;

        // Get user's cart (should exist from webhook)
        let cart = await client.fetch(
          groq`*[_type == "cart" && user->clerkUserId == $clerkUserId][0]`,
          { clerkUserId: ctx.auth.userId }
        );

        // Edge case: Cart missing - create one safely (self-healing)
        if (!cart) {
          console.warn(
            `Cart missing for user ${ctx.auth.userId}, creating new one`
          );

          const user = await client.fetch(
            groq`*[_type == "user" && clerkUserId == $clerkUserId][0]`,
            { clerkUserId: ctx.auth.userId }
          );

          if (!user) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User not found. Account sync required.",
            });
          }

          cart = await client.createIfNotExists({
            _id: `cart-${ctx.auth.userId}`,
            _type: "cart",
            user: { _type: "reference", _ref: user._id },
            cartItems: [],
          });
        }

        // Validate product/course availability and stock
        if (type === "product" && productId) {
          const product = await client.fetch(
            groq`*[_type == "product" && _id == $productId][0] {
              hasVariants,
              totalStock,
              variants[]{ sku, stock }
            }`,
            { productId }
          );

          if (!product) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Product not found",
            });
          }

          if (product.hasVariants) {
            if (!selectedVariantSku) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Variant SKU is required for products with variants",
              });
            }

            const selectedVariant = product.variants.find(
              (variant: any) => variant.sku === selectedVariantSku
            );

            if (!selectedVariant) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: `Product variant with SKU "${selectedVariantSku}" not found`,
              });
            }

            if (selectedVariant.stock < quantity) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Insufficient stock for selected variant",
              });
            }
          } else {
            if (product.totalStock && product.totalStock < quantity) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Insufficient stock",
              });
            }
          }
        } else if (type === "course" && courseId) {
          const course = await client.fetch(
            groq`*[_type == "course" && _id == $courseId][0]{ _id }`,
            { courseId }
          );

          if (!course) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Course not found",
            });
          }
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.cartItems?.findIndex((cartItem: any) => {
          if (type === "product" && productId) {
            if (selectedVariantSku) {
              return (
                cartItem.product?._ref === productId &&
                cartItem.selectedVariantSku === selectedVariantSku
              );
            }
            return cartItem.product?._ref === productId;
          } else if (type === "course" && courseId) {
            return cartItem.course?._ref === courseId;
          }
          return false;
        });

        const updatedItems = [...(cart.cartItems || [])];

        if (existingItemIndex !== -1) {
          // Update existing item quantity
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
          };
        } else {
          // Add new item (Sanity will auto-generate _key)
          const newItem: any = {
            _key: crypto.randomUUID(),
            type,
            quantity,
            ...(type === "product" &&
              productId && {
                product: { _type: "reference", _ref: productId },
                ...(selectedVariantSku && { selectedVariantSku }),
              }),
            ...(type === "course" &&
              courseId && {
                course: { _type: "reference", _ref: courseId },
                ...(preferredStartDate && { preferredStartDate }),
              }),
          };
          updatedItems.push(newItem);
        }

        // Update cart in Sanity
        const updatedCart = await client
          .patch(cart._id)
          .set({ cartItems: updatedItems })
          .commit();

        return updatedCart;
      } catch (error) {
        console.error("Error in addToCart:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add item to cart",
          cause: error,
        });
      }
    }),

  /**
   * Update quantity of specific cart item using item index
   */
  updateCartItem: protectedProcedure
    .input(updateCartItemSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { cartId, itemIndex, quantity } = input;

        // Get the cart and verify ownership
        const cart = await client.fetch(
          groq`*[_type == "cart" && _id == $cartId && user->clerkUserId == $clerkUserId][0]`,
          { cartId, clerkUserId: ctx.auth.userId }
        );

        if (!cart) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cart not found or access denied",
          });
        }

        const updatedItems = [...(cart.cartItems || [])];

        // Validate item index
        if (itemIndex < 0 || itemIndex >= updatedItems.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid item index",
          });
        }

        if (quantity === 0) {
          // Remove item from cart
          updatedItems.splice(itemIndex, 1);
        } else {
          // Update item quantity
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            quantity,
          };
        }

        const updatedCart = await client
          .patch(cartId)
          .set({ cartItems: updatedItems })
          .commit();

        return updatedCart;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update cart item",
        });
      }
    }),

  /**
   * Clear all items from user's "forever cart"
   * Used after successful order creation - empties cart but keeps it
   */
  clearCart: protectedProcedure
    .input(z.object({ cartId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify cart ownership
        const cart = await client.fetch(
          groq`*[_type == "cart" && _id == $cartId && user->clerkUserId == $clerkUserId][0]`,
          { cartId: input.cartId, clerkUserId: ctx.auth.userId }
        );

        if (!cart) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cart not found or access denied",
          });
        }

        const updatedCart = await client
          .patch(input.cartId)
          .set({ cartItems: [] })
          .commit();

        return updatedCart;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to clear cart",
        });
      }
    }),

  /**
   * Sync localStorage cart items to user's Sanity cart
   * Used during Phase 2: Login & Syncing
   */
  syncCartToUser: protectedProcedure
    .input(syncCartSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { localCartItems } = input;

        if (!localCartItems || localCartItems.length === 0) {
          return { success: true, message: "No items to sync" };
        }

        // Get existing user cart (should exist from webhook)
        let userCart = await client.fetch(
          groq`*[_type == "cart" && user->clerkUserId == $clerkUserId][0]`,
          { clerkUserId: ctx.auth.userId }
        );

        // Edge case: Cart missing - create one safely (self-healing)
        if (!userCart) {
          console.warn(
            `Cart missing during sync for user ${ctx.auth.userId}, creating new one`
          );

          const user = await client.fetch(
            groq`*[_type == "user" && clerkUserId == $clerkUserId][0]`,
            { clerkUserId: ctx.auth.userId }
          );

          if (!user) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User not found. Please sign out and sign back in.",
            });
          }

          userCart = await client.createIfNotExists({
            _id: `cart-${ctx.auth.userId}`,
            _type: "cart",
            user: { _type: "reference", _ref: user._id },
            cartItems: [],
          });
        }

        // Convert local cart items to Sanity format and validate
        const processedItems = await Promise.all(
          localCartItems.map(async (localItem) => {
            // Validate product/course availability
            if (localItem.type === "product" && localItem.productId) {
              const product = await client.fetch(
                groq`*[_type == "product" && _id == $productId][0]{
                  hasVariants, 
                  totalStock,
                  "selectedVariant": variants[sku == $selectedVariantSku][0] { sku, stock }
                }`,
                {
                  productId: localItem.productId,
                  selectedVariantSku: localItem.selectedVariantSku || "",
                }
              );

              if (!product) {
                throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Product not found",
                });
              }

              if (product.hasVariants) {
                if (!localItem.selectedVariantSku) {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                      "Variant SKU is required for products with variants",
                  });
                }

                if (!product.selectedVariant) {
                  throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Product variant with SKU "${localItem.selectedVariantSku}" not found`,
                  });
                }

                if (product.selectedVariant.stock < localItem.quantity) {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Insufficient stock for selected variant",
                  });
                }
              } else {
                if (
                  product.totalStock &&
                  product.totalStock < localItem.quantity
                ) {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Insufficient stock",
                  });
                }
              }
            } else if (localItem.type === "course" && localItem.courseId) {
              const course = await client.fetch(
                groq`*[_type == "course" && _id == $courseId][0]{ _id }`,
                { courseId: localItem.courseId }
              );

              if (!course) {
                throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Course not found",
                });
              }
            }

            // Convert to Sanity format (Sanity will auto-generate _key)
            return {
              _key: crypto.randomUUID(),
              type: localItem.type,
              quantity: localItem.quantity,
              ...(localItem.type === "product" && {
                product: { _type: "reference", _ref: localItem.productId },
                ...(localItem.selectedVariantSku && {
                  selectedVariantSku: localItem.selectedVariantSku,
                }),
              }),
              ...(localItem.type === "course" && {
                course: { _type: "reference", _ref: localItem.courseId },
                ...(localItem.preferredStartDate && {
                  preferredStartDate: localItem.preferredStartDate,
                }),
              }),
            };
          })
        );

        // Merge with existing cart items
        const existingItems = userCart.cartItems || [];
        const mergedItems = [...existingItems];

        for (const newItem of processedItems) {
          const existingIndex = mergedItems.findIndex((existing) => {
            if (newItem.type === "product") {
              return (
                existing.product?._ref === newItem.product?._ref &&
                existing.selectedVariantSku === newItem.selectedVariantSku
              );
            }
            return existing.course?._ref === newItem.course?._ref;
          });

          if (existingIndex !== -1) {
            // Take the higher quantity (merge strategy)
            mergedItems[existingIndex].quantity = Math.max(
              mergedItems[existingIndex].quantity,
              newItem.quantity
            );
          } else {
            mergedItems.push(newItem);
          }
        }

        // Update cart
        userCart = await client
          .patch(userCart._id)
          .set({ cartItems: mergedItems })
          .commit();

        return {
          success: true,
          cartId: userCart._id,
          itemsAdded: localCartItems.length,
        };
      } catch (error) {
        console.error("Error in syncCartToUser:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync cart. Please try again.",
        });
      }
    }),

  /**
   * Get display data for cart items (products and courses)
   */
  getDisplayData: baseProcedure
    .input(
      z.object({
        productIds: z.array(z.string()),
        courseIds: z.array(z.string()),
        selectedSKUs: z.array(z.string()),
      })
    )
    .query(async ({ input }) => {
      const { data } = await sanityFetch({
        query: CART_DISPLAY_QUERY,
        params: {
          productIds: input.productIds,
          courseIds: input.courseIds,
          selectedSKUs: input.selectedSKUs,
        },
      });

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Display data not found",
        });
      }

      return data as {
        products: CartDisplayProductType[];
        courses: CartDisplayCourseType[];
      };
    }),

  /**
   * Check if user has a pending payment order
   * Used for handling browser back button scenario from payment page
   */
  checkPendingOrder: protectedProcedure.query(async ({ ctx }) => {
    try {
      const pendingOrder = await client.fetch(
        groq`*[_type == "order" && user->clerkUserId == $clerkUserId && status == "pending_payment"][0] {
          _id,
          orderNumber,
          status,
          totalAmount,
          createdAt,
          orderItems[] {
            type,
            quantity,
            unitPrice,
            type == "product" => {
              "productId": product._ref,
              "productTitle": product->title,
              "productImage": product->images[0]
            },
            type == "course" => {
              "courseId": course._ref,
              "courseTitle": course->title,
              "courseImage": course->images[0]
            }
          }
        }`,
        { clerkUserId: ctx.auth.userId }
      );

      return pendingOrder || null;
    } catch (error) {
      console.error("Error checking pending order:", error);
      return null;
    }
  }),

  /**
   * Cancel a pending payment order
   * Used when user cancels checkout or wants to start over
   */
  cancelPendingOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify order ownership and status
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId && user->clerkUserId == $clerkUserId && status == "pending_payment"][0]`,
          {
            orderId: input.orderId,
            clerkUserId: ctx.auth.userId,
          }
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pending order not found or access denied",
          });
        }

        // Update order status to cancelled
        const updatedOrder = await client
          .patch(input.orderId)
          .set({
            status: "cancelled",
            updatedAt: new Date().toISOString(),
          })
          .commit();

        return updatedOrder;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel order",
        });
      }
    }),
});
