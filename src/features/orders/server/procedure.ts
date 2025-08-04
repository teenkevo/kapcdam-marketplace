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
  createOrderSchema,
  orderResponseSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  sanityOrderSchema,
  type CreateOrderInput,
  type OrderResponse,
} from "../schema";
import { CART_ITEMS_QUERY } from "@/features/cart/server/query";
import { CartSchema } from "@/features/cart/schema";
import {
  submitOrderSchema,
  type PesapalOrderRequest,
} from "@/features/payments/schema";
import { revalidatePath, revalidateTag } from "next/cache";

// Generate order number in format KAPC-YYYY-XXX
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomNumber = Math.floor(Math.random() * 999) + 1;
  const paddedNumber = randomNumber.toString().padStart(3, "0");
  return `KAPC-${year}-${paddedNumber}`;
}

// Calculate order totals from cart data
function calculateOrderTotals(
  cartItems: any[],
  cartDisplayData: any,
  appliedCoupon?: {
    code: string;
    discountAmount: number;
    originalPercentage: number;
  } | null,
  shippingCost: number = 0
) {
  let subtotalBeforeDiscount = 0;
  let itemDiscountTotal = 0;

  cartItems.forEach((cartItem) => {
    let itemPrice = 0;
    let discountInfo = null;

    if (cartItem.type === "product" && cartDisplayData?.products) {
      const product = cartDisplayData.products.find(
        (p: any) => p._id === cartItem.product?._ref
      );
      if (product) {
        // Handle variants
        if (cartItem.selectedVariantSku && product.variants?.length > 0) {
          const variant = product.variants.find(
            (v: any) => v.sku === cartItem.selectedVariantSku
          );
          itemPrice = variant
            ? parseInt(variant.price)
            : parseInt(product.price);
        } else {
          itemPrice = parseInt(product.price);
        }
        discountInfo = product.discountInfo;
      }
    }

    if (cartItem.type === "course" && cartDisplayData?.courses) {
      const course = cartDisplayData.courses.find(
        (c: any) => c._id === cartItem.course?._ref
      );
      if (course) {
        itemPrice = parseInt(course.price);
        discountInfo = course.discountInfo;
      }
    }

    const lineTotal = itemPrice * cartItem.quantity;

    // Calculate item-specific discount
    let lineDiscount = 0;
    if (discountInfo?.isActive && discountInfo.value > 0) {
      lineDiscount = Math.round((lineTotal * discountInfo.value) / 100);
    }

    subtotalBeforeDiscount += lineTotal;
    itemDiscountTotal += lineDiscount;
  });

  const subtotalAfterItemDiscounts = subtotalBeforeDiscount - itemDiscountTotal;
  const orderLevelDiscount = appliedCoupon?.discountAmount || 0;
  const total = subtotalAfterItemDiscounts + shippingCost - orderLevelDiscount;

  return {
    subtotal: subtotalAfterItemDiscounts,
    totalItemDiscounts: itemDiscountTotal,
    orderLevelDiscount,
    shippingCost,
    total: Math.max(0, total), // Ensure total is never negative
  };
}

export const ordersRouter = createTRPCRouter({
  /**
   * Process payment for an existing order
   */
  processOrderPayment: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<{ paymentUrl: string; orderTrackingId: string }> => {
        try {
          // Get order details
          const order = await client.fetch(
            groq`*[_type == "order" && _id == $orderId && customer->clerkUserId == $clerkUserId][0] {
            _id,
            orderNumber,
            total,
            currency,
            paymentMethod,
            customer->{email, firstName, lastName},
            shippingAddress->{_id, phone, address, city, fullName}
          }`,
            { orderId: input.orderId, clerkUserId: ctx.auth.userId }
          );

          if (!order) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Order not found or access denied",
            });
          }

          if (order.paymentMethod !== "pesapal") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Payment processing not required for this order",
            });
          }

          const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL_PROD ||
            process.env.NEXT_PUBLIC_BASE_URL;

          // Register IPN following donation pattern
          const registerIpn = await fetch(
            `${process.env.PESAPAL_API_URL}/URLSetup/RegisterIPN`,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${ctx.pesapalToken}`,
              },
              body: JSON.stringify({
                ipn_notification_type: "POST",
                url: `${baseUrl}/api/webhooks/pesapal`,
              }),
            }
          );

          if (!registerIpn.ok) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to register IPN",
            });
          }

          const ipnResult = await registerIpn.json();

          // Create Pesapal payment request following donation pattern
          const pesapalRequest: PesapalOrderRequest = {
            id: order._id,
            currency: order.currency || "UGX",
            amount: order.total,
            description: `Order ${order.orderNumber} - Kapcdam Marketplace`,
            callback_url: `${baseUrl}/api/payment/callback?orderId=${order._id}`,
            notification_id: ipnResult.ipn_id,
            billing_address: {
              email_address: order.customer.email,
              phone_number: order.shippingAddress.phone,
              country_code: "UG",
              first_name:
                order.customer.firstName ||
                order.shippingAddress.fullName.split(" ")[0],
              last_name:
                order.customer.lastName ||
                order.shippingAddress.fullName.split(" ").slice(1).join(" "),
              line_1: order.shippingAddress.address,
              city: order.shippingAddress.city || "Kampala",
            },
          };

          // Submit order to Pesapal
          const paymentResponse = await fetch(
            `${process.env.PESAPAL_API_URL}/Transactions/SubmitOrderRequest`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${ctx.pesapalToken}`,
              },
              body: JSON.stringify(pesapalRequest),
            }
          );

          if (!paymentResponse.ok) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to submit order to payment processor",
            });
          }

          const paymentResult = await paymentResponse.json();

          // Update order with tracking ID
          await client
            .patch(order._id)
            .set({
              transactionId: paymentResult.order_tracking_id,
              paymentStatus: "pending",
            })
            .commit();

          return {
            paymentUrl: paymentResult.redirect_url,
            orderTrackingId: paymentResult.order_tracking_id,
          };
        } catch (error) {
          if (error instanceof TRPCError) {
            throw error;
          }
          console.error("Payment processing error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to process payment",
          });
        }
      }
    ),

  /**
   * Create a new order from cart
   */
  createOrder: protectedProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }): Promise<OrderResponse> => {
      try {
        const {
          shippingAddress,
          deliveryMethod,
          paymentMethod,
          selectedDeliveryZone,
          appliedCoupon,
        } = input;

        // 1. Fetch and validate cart
        const cart = await client.fetch(CART_ITEMS_QUERY, {
          clerkUserId: ctx.auth.userId,
        });

        if (!cart) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cart not found or access denied",
          });
        }

        const validatedCart = CartSchema.parse(cart);

        if (!validatedCart.cartItems || validatedCart.cartItems.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cart is empty",
          });
        }

        // 2. Get user reference
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

        // 3. Fetch product/course display data for pricing
        const productIds = validatedCart.cartItems
          .filter((item) => item.type === "product" && item.productId)
          .map((item) => item.productId!);

        const courseIds = validatedCart.cartItems
          .filter((item) => item.type === "course" && item.courseId)
          .map((item) => item.courseId!);

        const selectedSKUs = validatedCart.cartItems
          .filter((item) => item.selectedVariantSku)
          .map((item) => item.selectedVariantSku!);

        const cartDisplayData = await client.fetch(
          groq`{
            "products": *[_type == "product" && _id in $productIds] {
              _id,
              title,
              price,
              hasVariants,
              "hasDiscount": defined(discount) && discount.isActive == true,
              "discountInfo": select(
                defined(discount) && discount.isActive == true => discount,
                null
              ),
              "variants": variants[sku in $selectedSKUs] {
                sku,
                price,
                attributes[] {
                  "name": attributeRef->name,
                  "value": value
                }
              }
            },
            "courses": *[_type == "course" && _id in $courseIds] {
              _id,
              title,
              price,
              description,
              duration,
              skillLevel,
              "hasDiscount": defined(discount) && discount.isActive == true,
              "discountInfo": select(
                defined(discount) && discount.isActive == true => discount,
                null
              )
            }
          }`,
          { productIds, courseIds, selectedSKUs }
        );

        // 4. Calculate shipping cost
        const shippingCost =
          deliveryMethod === "pickup" ? 0 : selectedDeliveryZone?.fee || 0;

        // 5. Calculate totals
        const totals = calculateOrderTotals(
          validatedCart.cartItems,
          cartDisplayData,
          appliedCoupon,
          shippingCost
        );

        // 6. Check for existing pending orders and cancel them (as per lifecycle Phase 3)
        const existingPendingOrders = await client.fetch(
          groq`*[_type == "order" && customer->clerkUserId == $clerkUserId && paymentStatus == "pending"]`,
          { clerkUserId: ctx.auth.userId }
        );

        // Cancel any existing pending orders
        if (existingPendingOrders.length > 0) {
          await Promise.all(
            existingPendingOrders.map((order: any) =>
              client
                .patch(order._id)
                .set({
                  status: "cancelled",
                  paymentStatus: "cancelled",
                  updatedAt: new Date().toISOString(),
                })
                .commit()
            )
          );
        }

        // 7. Generate order number
        const orderNumber = generateOrderNumber();

        // 8. Get discount code reference if coupon is applied
        let discountCodeRef = null;
        if (appliedCoupon) {
          const discountCode = await client.fetch(
            groq`*[_type == "discountCodes" && code == $code][0]{ _id }`,
            { code: appliedCoupon.code.toUpperCase() }
          );
          if (discountCode) {
            discountCodeRef = { _type: "reference", _ref: discountCode._id };
          }
        }

        // 9. Validate shipping address (must be existing address ID only)
        let addressId: string;

        if ("addressId" in shippingAddress) {
          // Using existing address
          addressId = shippingAddress.addressId;

          // Verify address belongs to user
          const existingAddress = await client.fetch(
            groq`*[_type == "address" && _id == $addressId && user->clerkUserId == $clerkUserId][0]`,
            { addressId, clerkUserId: ctx.auth.userId }
          );

          if (!existingAddress) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Address not found or access denied",
            });
          }
        } else {
          // No longer supporting address creation during order - addresses must exist
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Address must be selected from existing addresses. Please create an address first.",
          });
        }

        // 10. Create order document
        const orderDoc = {
          _type: "order",
          orderNumber,
          orderDate: new Date().toISOString(),
          customer: { _type: "reference", _ref: user._id },
          subtotal: totals.subtotal,
          tax: 0,
          shippingCost: totals.shippingCost,
          totalItemDiscounts: totals.totalItemDiscounts,
          ...(appliedCoupon && {
            orderLevelDiscount: {
              ...(discountCodeRef && { discountCode: discountCodeRef }),
              discountAmount: appliedCoupon.discountAmount,
              originalPercentage: appliedCoupon.originalPercentage,
              appliedAt: new Date().toISOString(),
            },
          }),
          total: totals.total,
          currency: "UGX",
          paymentStatus: "pending",
          paymentMethod,
          status: "pending",
          isActive: true,
          shippingAddress: { _type: "reference", _ref: addressId },
          deliveryMethod,
          ...(selectedDeliveryZone && {
            estimatedDelivery: new Date(
              Date.now() + 24 * 60 * 60 * 1000 // Default to 24 hours from now
            ).toISOString(),
          }),
        };

        const createdOrder = await client.create(orderDoc);

        // 11. Create order items
        const orderItems = await Promise.all(
          validatedCart.cartItems.map(async (cartItem) => {
            let originalPrice = 0;
            let discountApplied = 0;
            let productSnapshot = null;
            let courseSnapshot = null;

            if (cartItem.type === "product") {
              const product = cartDisplayData.products?.find(
                (p: any) => p._id === cartItem.productId
              );
              if (product) {
                if (
                  cartItem.selectedVariantSku &&
                  product.variants?.length > 0
                ) {
                  const variant = product.variants.find(
                    (v: any) => v.sku === cartItem.selectedVariantSku
                  );
                  originalPrice = variant
                    ? parseInt(variant.price)
                    : parseInt(product.price);

                  productSnapshot = {
                    title: product.title,
                    sku: cartItem.selectedVariantSku,
                    variantInfo: variant?.attributes
                      ?.map((attr: any) => `${attr.name}: ${attr.value}`)
                      .join(", "),
                  };
                } else {
                  originalPrice = parseInt(product.price);
                  productSnapshot = {
                    title: product.title,
                    sku: null,
                    variantInfo: null,
                  };
                }

                // Calculate discount
                if (
                  product.discountInfo?.isActive &&
                  product.discountInfo.value > 0
                ) {
                  discountApplied = Math.round(
                    (originalPrice * product.discountInfo.value) / 100
                  );
                }
              }
            }

            if (cartItem.type === "course") {
              const course = cartDisplayData.courses?.find(
                (c: any) => c._id === cartItem.courseId
              );
              if (course) {
                originalPrice = parseInt(course.price);
                courseSnapshot = {
                  title: course.title,
                  description: course.description,
                  duration: course.duration,
                  skillLevel: course.skillLevel,
                };

                // Calculate discount
                if (
                  course.discountInfo?.isActive &&
                  course.discountInfo.value > 0
                ) {
                  discountApplied = Math.round(
                    (originalPrice * course.discountInfo.value) / 100
                  );
                }
              }
            }

            const finalPrice = originalPrice - discountApplied;
            const lineTotal = finalPrice * cartItem.quantity;

            const orderItem = {
              _type: "orderItem",
              order: { _type: "reference", _ref: createdOrder._id },
              type: cartItem.type,
              quantity: cartItem.quantity,
              originalPrice,
              discountApplied,
              finalPrice,
              lineTotal,
              ...(cartItem.type === "product" && {
                product: cartItem.productId,
                ...(productSnapshot && { variantSnapshot: productSnapshot }),
              }),
              ...(cartItem.type === "course" && {
                course: cartItem.courseId,
                ...(cartItem.preferredStartDate && {
                  preferredStartDate: cartItem.preferredStartDate,
                }),
                ...(courseSnapshot && { courseSnapshot }),
              }),
              fulfillmentStatus: "pending",
              addedAt: new Date().toISOString(),
              isActive: true,
            };

            return client.create(orderItem);
          })
        );

        // 12. Clear the user's server cart (as per lifecycle Phase 3)
        await client
          .patch(cart._id)
          .set({
            cartItems: [], // Clear cart items - cart purpose is fulfilled
          })
          .commit();

        // 13. Invalidate server-side caches to ensure fresh cart data
        try {
          // Invalidate pages that depend on cart data
          revalidatePath("/", "layout"); // Invalidate layout cache (header with cart)
          revalidatePath("/checkout", "page"); // Invalidate checkout pages
          revalidatePath("/cart", "page"); // Invalidate cart page if it exists

          // Invalidate Sanity Live cache tags for cart queries
          revalidateTag("cart-items"); // Invalidate cart items queries
          revalidateTag("cart-by-id"); // Invalidate cart by ID queries
          revalidateTag("cart-display"); // Invalidate cart display data queries
        } catch (error) {
          console.error("Cache invalidation error:", error);
          // Don't fail the order creation if cache invalidation fails
        }

        // 14. Apply coupon if provided and track usage
        if (appliedCoupon && ctx.auth.userId) {
          try {
            // Import coupon router to apply coupon
            const { couponRouter } = await import(
              "@/features/coupons/server/procedure"
            );

            // Create a TRPC context for the coupon application
            const couponCtx = {
              auth: ctx.auth,
              pesapalToken: ctx.pesapalToken,
            };

            // Apply the coupon and track usage
            await couponRouter.createCaller(couponCtx).applyCoupon({
              code: appliedCoupon.code,
              orderNumber,
              orderTotal: totals.subtotal + totals.shippingCost,
              discountAmount: appliedCoupon.discountAmount,
              orderId: createdOrder._id,
            });
          } catch (error) {
            console.error("Failed to apply coupon:", error);
            // Don't fail the order creation if coupon tracking fails
          }
        }

        return {
          orderId: createdOrder._id,
          orderNumber,
          total: totals.total,
          paymentRequired: paymentMethod === "pesapal" && totals.total > 0,
          paymentMethod,
          shippingAddress: { addressId },
          user: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Order creation error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order",
        });
      }
    }),

  /**
   * Update order status
   */
  updateOrderStatus: protectedProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { orderId, status, notes } = input;

        // Verify order ownership or admin access
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId && customer->clerkUserId == $clerkUserId][0]`,
          { orderId, clerkUserId: ctx.auth.userId }
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found or access denied",
          });
        }

        const updateData: any = { status, updatedAt: new Date().toISOString() };

        if (notes) {
          updateData.notes = notes;
        }

        if (status === "delivered") {
          updateData.deliveredAt = new Date().toISOString();
        }

        const updatedOrder = await client
          .patch(orderId)
          .set(updateData)
          .commit();

        return updatedOrder;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update order status",
        });
      }
    }),

  /**
   * Update payment status (for webhooks/callbacks)
   */
  updatePaymentStatus: baseProcedure
    .input(updatePaymentStatusSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { orderId, paymentStatus, transactionId, paidAt } = input;

        const updateData: any = {
          paymentStatus,
          updatedAt: new Date().toISOString(),
        };

        if (transactionId) {
          updateData.transactionId = transactionId;
        }

        if (paidAt) {
          updateData.paidAt = paidAt;
        }

        // If payment is confirmed, update order status
        if (paymentStatus === "paid") {
          updateData.status = "confirmed";
          updateData.paidAt = paidAt || new Date().toISOString();
        }

        const updatedOrder = await client
          .patch(orderId)
          .set(updateData)
          .commit();

        return updatedOrder;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update payment status",
        });
      }
    }),

  /**
   * Get user's orders
   */
  getUserOrders: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const orders = await client.fetch(
          groq`*[_type == "order" && customer->clerkUserId == $clerkUserId && isActive == true] | order(orderDate desc) [$offset...$limit] {
            _id,
            orderNumber,
            orderDate,
            subtotal,
            shippingCost,
            total,
            paymentStatus,
            paymentMethod,
            status,
            deliveryMethod,
            estimatedDelivery,
            deliveredAt
          }`,
          {
            clerkUserId: ctx.auth.userId,
            offset: input.offset,
            limit: input.offset + input.limit,
          }
        );

        return orders;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch orders",
        });
      }
    }),

  /**
   * Get pending order for user (for checkout back button handling)
   */
  getPendingOrder: protectedProcedure.query(async ({ ctx }) => {
    try {
      const pendingOrder = await client.fetch(
        groq`*[_type == "order" && customer->clerkUserId == $clerkUserId && paymentStatus == "pending"][0] {
            _id,
            orderNumber,
            orderDate,
            subtotal,
            shippingCost,
            total,
            currency,
            paymentMethod,
            "orderItems": *[_type == "orderItem" && order._ref == ^._id] {
              _id,
              type,
              quantity,
              finalPrice,
              lineTotal,
              product->{title},
              course->{title},
              variantSnapshot,
              courseSnapshot
            }
          }`,
        { clerkUserId: ctx.auth.userId }
      );

      // console.log("pendingOrder", pendingOrder);

      return pendingOrder;
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
        message: "Failed to fetch pending order",
      });
    }
  }),

  /**
   * Cancel pending order (for checkout back button handling)
   */
  cancelPendingOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify order ownership and pending status
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId && customer->clerkUserId == $clerkUserId && paymentStatus == "pending"][0]`,
          { orderId: input.orderId, clerkUserId: ctx.auth.userId }
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pending order not found or access denied",
          });
        }

        // Cancel the order
        const cancelledOrder = await client
          .patch(input.orderId)
          .set({
            status: "cancelled",
            paymentStatus: "cancelled",
            updatedAt: new Date().toISOString(),
          })
          .commit();

        return { success: true, order: cancelledOrder };
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

  /**
   * Get order by ID
   */
  getOrderById: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId && customer->clerkUserId == $clerkUserId][0] {
            _id,
            orderNumber,
            orderDate,
            subtotal,
            tax,
            shippingCost,
            totalItemDiscounts,
            orderLevelDiscount,
            total,
            currency,
            paymentStatus,
            paymentMethod,
            transactionId,
            paidAt,
            status,
            notes,
            shippingAddress->,
            deliveryMethod,
            estimatedDelivery,
            deliveredAt,
            "orderItems": *[_type == "orderItem" && order._ref == ^._id] {
              _id,
              type,
              quantity,
              originalPrice,
              discountApplied,
              finalPrice,
              lineTotal,
              product->,
              course->,
              variantSnapshot,
              courseSnapshot,
              fulfillmentStatus
            }
          }`,
          { orderId: input.orderId, clerkUserId: ctx.auth.userId }
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found or access denied",
          });
        }

        return order;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch order",
        });
      }
    }),
});
