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
import { CART_DISPLAY_QUERY, CART_ITEMS_QUERY, CART_BY_ID_QUERY } from "./query";
import { revalidatePath } from "next/cache";
import { sanityFetch } from "@/sanity/lib/live";

export const cartRouter = createTRPCRouter({
  /**
   * Get cart by ID with user ownership validation
   * Only for authenticated users
   */
  getCartById: protectedProcedure
    .input(z.object({ cartId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const cart = await client.fetch(CART_BY_ID_QUERY, {
          clerkUserId: ctx.auth.userId,
          cartId: input.cartId,
        });

        if (!cart) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cart not found or access denied",
          });
        }

        return CartSchema.parse(cart);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
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
   * Get the authenticated user's cart with full product/course details
   * Only for authenticated users
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
   * Add item to authenticated user's cart
   * Handles both products (with/without variants) and courses
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

        let cart = await client.fetch(
          groq`*[_type == "cart" && user->clerkUserId == $clerkUserId && isActive == true][0]`,
          { clerkUserId: ctx.auth.userId }
        );

        // Get user document reference
        const user = await client.fetch(
          groq`*[_type == "user" && clerkUserId == $clerkUserId][0]`,
          { clerkUserId: ctx.auth.userId }
        );

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "User not found. Please ensure your account is properly set up.",
          });
        }

        // Create cart if it doesn't exist
        if (!cart) {
          const newCart = {
            _type: "cart",
            user: { _type: "reference", _ref: user._id },
            cartItems: [],
            itemCount: 0,
            subtotal: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          cart = await client.create(newCart);
        }

        // Get current price for the item
        let currentPrice = 0;

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
            // Check if variant SKU is provided
            if (!selectedVariantSku) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Variant SKU is required for products with variants",
              });
            }

            // Find the selected variant
            const selectedVariant = product.variants.find(
              (variant: any) => variant.sku === selectedVariantSku
            );

            // Check if the selected variant exists
            if (!selectedVariant) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: `Product variant with SKU "${selectedVariantSku}" not found`,
              });
            }

            // Set the current price to the price of the selected variant
            currentPrice = parseInt(selectedVariant.price);
            if (parseInt(selectedVariant.stock) < quantity) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Insufficient stock for selected variant",
              });
            }
          } else {
            if (!product.price) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Product price not found",
              });
            }

            currentPrice = parseInt(product.price);

            if (product.totalStock && product.totalStock < quantity) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Insufficient stock",
              });
            }
          }
        } else if (type === "course" && courseId) {
          const course = await client.fetch(
            groq`*[_type == "course" && _id == $courseId][0]{ price }`,
            { courseId }
          );

          if (!course) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Course not found",
            });
          }

          currentPrice = parseInt(course.price);
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.cartItems?.findIndex((cartItem: any) => {
          if (type === "product" && productId) {
            if (selectedVariantSku) {
              return (
                cartItem.product._ref === productId &&
                cartItem.selectedVariantSku === selectedVariantSku
              );
            }
            return cartItem.product._ref === productId;
          } else {
            return cartItem.course._ref === courseId;
          }
        });

        const updatedItems = [...(cart.cartItems || [])];

        if (existingItemIndex !== -1) {
          // Update existing item quantity
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
            // currentPrice,
            lastUpdated: new Date().toISOString(),
          };
        } else {
          const newItem = {
            _key: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type,
            quantity,
            // currentPrice,
            addedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            ...(type === "product" && {
              product: { _type: "reference", _ref: productId },
              selectedVariantSku: selectedVariantSku || null,
            }),
            ...(type === "course" && {
              course: { _type: "reference", _ref: courseId },
              preferredStartDate: preferredStartDate || null,
            }),
          };
          updatedItems.push(newItem);
        }

        // Calculate totals
        const itemCount = updatedItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const subtotal = updatedItems.reduce(
          (sum, item) => sum + item.currentPrice * item.quantity,
          0
        );

        // Update cart in Sanity
        const updatedCart = await client
          .patch(cart._id)
          .set({
            cartItems: updatedItems,
            itemCount,
            subtotal,
            updatedAt: new Date().toISOString(),
          })
          .commit();

        revalidatePath("/");

        return updatedCart;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add item to cart",
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

        // Recalculate totals
        const itemCount = updatedItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const subtotal = updatedItems.reduce(
          (sum, item) => sum + item.currentPrice * item.quantity,
          0
        );

        const updatedCart = await client
          .patch(cartId)
          .set({
            cartItems: updatedItems,
            itemCount,
            subtotal,
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
   * Clear all items from user's cart
   * Keeps the cart document but empties it
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
            subtotal: 0,
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
   * Sync local cart items to user's Sanity cart
   * Used when anonymous user logs in with items in local storage
   * This is a one-time operation that merges local cart with existing user cart
   */
  syncCartToUser: protectedProcedure
    .input(syncCartSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { localCartItems } = input;

        if (!localCartItems || localCartItems.length === 0) {
          // Nothing to sync
          return { success: true, message: "No items to sync" };
        }

        // Get user document
        const user = await client.fetch(
          groq`*[_type == "user" && clerkUserId == $clerkUserId][0]`,
          { clerkUserId: ctx.auth.userId }
        );

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Get existing user cart
        let userCart = await client.fetch(
          groq`*[_type == "cart" && user->clerkUserId == $clerkUserId && isActive == true][0]`,
          { clerkUserId: ctx.auth.userId }
        );

        // Convert local cart items to Sanity format and get current prices
        const processedItems = await Promise.all(
          localCartItems.map(async (localItem, index) => {
            let currentPrice = 0;

            // Get current price for the item
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

                currentPrice = parseInt(product.selectedVariant.price);

                // Optional: Check stock
                if (product.selectedVariant.stock < localItem.quantity) {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Insufficient stock for selected variant",
                  });
                }
              } else {
                if (!product.price) {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Product price not found",
                  });
                }
                currentPrice = parseInt(product.price);

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
                groq`*[_type == "course" && _id == $courseId][0]{ price }`,
                { courseId: localItem.courseId }
              );
              currentPrice = course ? parseInt(course.price) : 0;
            } else if (localItem.type === "course" && localItem.courseId) {
              const course = await client.fetch(
                groq`*[_type == "course" && _id == $courseId][0]{ price }`,
                { courseId: localItem.courseId }
              );

              if (!course) {
                throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Course not found",
                });
              }

              if (!course.price) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Course price not found",
                });
              }

              currentPrice = parseInt(course.price);
            }
            return {
              _key: `synced-item-${Date.now()}-${index}`,
              type: localItem.type,
              quantity: localItem.quantity,
              currentPrice,
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

        if (userCart) {
          // Merge with existing cart
          const existingItems = userCart.cartItems || [];
          const mergedItems = [...existingItems];

          processedItems.forEach((newItem) => {
            const existingIndex = mergedItems.findIndex((existing) => {
              if (newItem.type === "product") {
                return (
                  existing.product?._id === newItem.product?._ref &&
                  existing.selectedVariantSku === newItem.selectedVariantSku
                );
              }
              return existing.course?._id === newItem.course?._ref;
            });

            if (existingIndex !== -1) {
              // Update quantity of existing item
              mergedItems[existingIndex].quantity += newItem.quantity;
              mergedItems[existingIndex].lastUpdated = new Date().toISOString();
            } else {
              // Add new item
              mergedItems.push(newItem);
            }
          });

          // Calculate new totals
          const mergedItemCount = mergedItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          const mergedSubtotal = mergedItems.reduce(
            (sum, item) => sum + item.currentPrice * item.quantity,
            0
          );

          // Update existing cart
          userCart = await client
            .patch(userCart._id)
            .set({
              cartItems: mergedItems,
              itemCount: mergedItemCount,
              subtotal: mergedSubtotal,
              updatedAt: new Date().toISOString(),
            })
            .commit();
        } else {
          const itemCount = processedItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          const subtotal = processedItems.reduce(
            (sum, item) => sum + item.currentPrice * item.quantity,
            0
          );

          const newCart = {
            _type: "cart",
            user: { _type: "reference", _ref: user._id },
            cartItems: processedItems,
            itemCount,
            subtotal,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          userCart = await client.create(newCart);
        }

        return {
          success: true,
          cartId: userCart._id,
          itemsAdded: localCartItems.length,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync cart",
        });
      }
    }),

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
        throw new TRPCError({ code: "NOT_FOUND", message: "" });
      }

      return data as {
        products: CartDisplayProductType[];
        courses: CartDisplayCourseType[];
      };
    }),
});
