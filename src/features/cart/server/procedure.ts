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
import { revalidatePath } from "next/cache";
import { sanityFetch } from "@/sanity/lib/live";

export const cartRouter = createTRPCRouter({
  /**
   * Get the authenticated user's cart with full product/course details
   * Only for authenticated users - the "forever cart"
   */
  getUserCart: protectedProcedure.query(async ({ ctx }) => {
    try {
      const cart = await client.fetch(CART_ITEMS_QUERY, {
        clerkUserId: ctx.auth.userId,
      });

      if (!cart) {
        return null;
      }

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
   * If cart is missing (edge case), we'll create one safely
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

          // Get user document reference
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

          // Create cart with consistent ID format (same as webhook)
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
              price,
              totalStock,
              variants[]{
                price,
                sku,
                stock
              }
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

            if (parseInt(selectedVariant.stock) < quantity) {
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
            lastUpdated: new Date().toISOString(),
          };
        } else {
          // Add new item
          const newItem = {
            _key: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type,
            quantity,
            addedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            ...(type === "product" &&
              productId && {
                product: { _type: "reference", _ref: productId },
                selectedVariantSku: selectedVariantSku || null,
              }),
            ...(type === "course" &&
              courseId && {
                course: { _type: "reference", _ref: courseId },
                preferredStartDate: preferredStartDate || null,
              }),
          };
          updatedItems.push(newItem);
        }

        // Calculate item count
        const itemCount = updatedItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        // Update cart in Sanity
        const updatedCart = await client
          .patch(cart._id)
          .set({
            cartItems: updatedItems,
            itemCount,
            updatedAt: new Date().toISOString(),
          })
          .commit();

        revalidatePath("/");
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
   * Update quantity of specific cart item
   * Uses item index since cart items are array elements
   */
  updateCartItem: protectedProcedure
    .input(updateCartItemSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { cartId, itemIndex, quantity } = input;

        // Get the cart and verify ownership
        const cart = await client.fetch(
          groq`*[_type == "cart" && _id == $cartId && user->clerkUserId == $clerkUserId][0]`,
          {
            cartId,
            clerkUserId: ctx.auth.userId,
          }
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
            lastUpdated: new Date().toISOString(),
          };
        }

        // Recalculate item count
        const itemCount = updatedItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        const updatedCart = await client
          .patch(cartId)
          .set({
            cartItems: updatedItems,
            itemCount,
            updatedAt: new Date().toISOString(),
          })
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
          {
            cartId: input.cartId,
            clerkUserId: ctx.auth.userId,
          }
        );

        if (!cart) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cart not found or access denied",
          });
        }

        const updatedCart = await client
          .patch(input.cartId)
          .set({
            cartItems: [],
            itemCount: 0,
            updatedAt: new Date().toISOString(),
          })
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
   * SIMPLIFIED: Only syncs items, doesn't handle user creation
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

          // Create cart with consistent ID format
          userCart = await client.createIfNotExists({
            _id: `cart-${ctx.auth.userId}`,
            _type: "cart",
            user: { _type: "reference", _ref: user._id },
            cartItems: [],
          });
        }

        // Convert local cart items to Sanity format and validate availability
        const processedItems = await Promise.all(
          localCartItems.map(async (localItem, index) => {
            // Validate item availability and stock
            if (localItem.type === "product" && localItem.productId) {
              const product = await client.fetch(
                groq`*[_type == "product" && _id == $productId][0]{
                  price, 
                  hasVariants, 
                  totalStock,
                  "selectedVariant": variants[sku == $selectedVariantSku][0] {
                    sku,
                    price,
                    stock
                  }
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

            return {
              _key: `synced-item-${Date.now()}-${index}`,
              type: localItem.type,
              quantity: localItem.quantity,
              addedAt: localItem.addedAt,
              lastUpdated: new Date().toISOString(),
              ...(localItem.type === "product" && {
                product: { _type: "reference", _ref: localItem.productId },
                selectedVariantSku: localItem.selectedVariantSku || null,
              }),
              ...(localItem.type === "course" && {
                course: { _type: "reference", _ref: localItem.courseId },
                preferredStartDate: localItem.preferredStartDate || null,
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
            const newQuantity = Math.max(
              mergedItems[existingIndex].quantity,
              newItem.quantity
            );

            if (newItem.type === "product" && newItem.product?._ref) {
              const currentProduct = await client.fetch(
                groq`*[_type == "product" && _id == $productId][0]{
                  hasVariants, totalStock,
                  "selectedVariant": variants[sku == $selectedVariantSku][0] { sku, stock }
                }`,
                {
                  productId: newItem.product._ref,
                  selectedVariantSku: newItem.selectedVariantSku || "",
                }
              );

              if (currentProduct) {
                const availableStock = currentProduct.hasVariants
                  ? currentProduct.selectedVariant?.stock
                  : currentProduct.totalStock;

                if (availableStock && newQuantity > availableStock) {
                  mergedItems[existingIndex].quantity = availableStock;
                  console.warn(
                    `Stock validation: Adjusted quantity from ${newQuantity} to ${availableStock} for product ${newItem.product._ref}`
                  );
                } else {
                  mergedItems[existingIndex].quantity = newQuantity;
                }
              } else {
                mergedItems[existingIndex].quantity = newQuantity;
              }
            } else {
              mergedItems[existingIndex].quantity = newQuantity;
            }

            mergedItems[existingIndex].lastUpdated = new Date().toISOString();
          } else {
            mergedItems.push(newItem);
          }
        }

        // Calculate new item count
        const mergedItemCount = mergedItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        // Update cart
        userCart = await client
          .patch(userCart._id)
          .set({
            cartItems: mergedItems,
            itemCount: mergedItemCount,
            updatedAt: new Date().toISOString(),
          })
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
   * Used for rendering cart UI with product/course details
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

  // TODO: Create order management procedures in separate file:
  //
  // createOrderFromCart: protectedProcedure
  //   - Convert cart items to order
  //   - Set order status to 'pending_payment'
  //   - Clear user's cart (Phase 3)
  //   - Return order ID for payment processing
  //
  // handlePaymentSuccess: protectedProcedure
  //   - Update order status to 'processing'
  //   - Reduce inventory for sold items
  //   - Send confirmation emails
  //
  // handlePaymentFailure: protectedProcedure
  //   - Update order status to 'payment_failed'
  //   - Keep order for retry attempts
  //
  // checkPendingOrder: protectedProcedure
  //   - Check if user has pending_payment order
  //   - Used for handling browser back button scenario
  //
  // cancelPendingOrder: protectedProcedure
  //   - Update order status to 'cancelled'
  //   - Used when user cancels checkout
});
