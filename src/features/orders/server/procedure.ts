import { TRPCError } from "@trpc/server";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
  customerProcedure,
} from "@/trpc/init";
import { z } from "zod";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import {
  createOrderSchema,
  orderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  orderMetaSchema,
  customerCancelOrderSchema,
  type OrderResponse,
} from "../schema";
import { CART_ITEMS_QUERY } from "@/features/cart/server/query";
import { CartSchema } from "@/features/cart/schema";
import {
  submitOrderSchema,
  type PesapalOrderRequest,
} from "@/features/payments/schema";
import { revalidatePath, revalidateTag } from "next/cache";
import { getDisplayTitle } from "@/features/cart/helpers";
import { nanoid } from "nanoid";

// Generate order number in format KAPC-YYYY-XXX
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomNumber = Math.floor(Math.random() * 999) + 1;
  const paddedNumber = randomNumber.toString().padStart(3, "0");
  return `KAPC-${year}-${paddedNumber}`;
}

// Stock management utility functions
async function reduceStockForOrder(orderItems: any[]) {
  const stockUpdates = [];

  for (const orderItem of orderItems) {
    if (orderItem.type === "product" && orderItem.product) {
      const product = orderItem.product;
      const quantity = orderItem.quantity;

      if (product.hasVariants && orderItem.variantSku) {
        // Reduce variant stock
        stockUpdates.push(
          client
            .patch(product._id)
            .dec({
              [`variants[sku == "${orderItem.variantSku}"].stock`]: quantity,
            })
            .commit()
        );
      } else if (!product.hasVariants && product.totalStock !== undefined) {
        // Reduce product total stock
        stockUpdates.push(
          client.patch(product._id).dec({ totalStock: quantity }).commit()
        );
      }
    }
  }

  // Execute all stock updates
  if (stockUpdates.length > 0) {
    await Promise.all(stockUpdates);
    console.log(`Reduced stock for ${stockUpdates.length} products/variants`);
  }
}

async function restoreStockForOrder(orderItems: any[]) {
  const stockUpdates = [];

  for (const orderItem of orderItems) {
    if (orderItem.type === "product" && orderItem.product) {
      const product = orderItem.product;
      const quantity = orderItem.quantity;

      if (product.hasVariants && orderItem.variantSku) {
        // Restore variant stock
        stockUpdates.push(
          client
            .patch(product._id)
            .inc({
              [`variants[sku == "${orderItem.variantSku}"].stock`]: quantity,
            })
            .commit()
        );
      } else if (!product.hasVariants && product.totalStock !== undefined) {
        // Restore product total stock
        stockUpdates.push(
          client.patch(product._id).inc({ totalStock: quantity }).commit()
        );
      }
    }
  }

  // Execute all stock updates
  if (stockUpdates.length > 0) {
    await Promise.all(stockUpdates);
    console.log(`Restored stock for ${stockUpdates.length} products/variants`);
  }
}

// Helper function to determine if stock should be restored for an order
function shouldRestoreStockForOrder(order: any): boolean {
  // COD orders always had stock reduced at creation, so restore stock when cancelled
  if (order.paymentMethod === "cod") {
    return true;
  }
  
  // Pesapal orders only had stock reduced if payment was completed
  if (order.paymentMethod === "pesapal") {
    // Only restore stock if payment was actually completed (stock was reduced)
    if (order.paymentStatus === "paid") {
      return true;
    }
    // Don't restore stock for not_initiated, pending, failed orders (stock never reduced)
    return false;
  }
  
  // For any other payment methods, assume stock was reduced and should be restored
  return true;
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
        (p: any) => p._id === cartItem.productId
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
        (c: any) => c._id === cartItem.courseId
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
    total: Math.max(0, total),
  };
}

export const ordersRouter = createTRPCRouter({
  /**
   * Process payment for an existing order
   */
  processOrderPayment: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<{ paymentUrl: string; orderTrackingId: string }> => {
        try {
          const order = await client.fetch(
            groq`*[_type == "order" && _id == $orderId && customer->clerkUserId == $clerkUserId][0]{
              "orderId": _id,
              orderNumber,
              total,
              paymentMethod,
              paymentStatus,
              transactionId,
              customer->{ email, firstName, lastName },
              "billingAddress": shippingAddress->{ phone, address, city, fullName },
              orderItems[]{ name }
            }`,
            { orderId: input.orderId, clerkUserId: ctx.auth.userId }
          );

          if (!order) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Order not found",
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
                url: `${baseUrl}/api/webhooks/pesapal/orders`,
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

          const pesapalRequest: PesapalOrderRequest = {
            id: order.orderNumber,
            currency: "UGX",
            amount: order.total,
            description: `Order for ${order.orderItems.map((item: any) => item.name).join(", ")}`,
            callback_url: `${baseUrl}/api/payment/orders/callback/${order.orderId}`,
            notification_id: ipnResult.ipn_id,
            billing_address: {
              email_address: order.customer.email,
              phone_number: order.billingAddress.phone,
              country_code: "UG",
              first_name:
                order.customer.firstName ||
                order.billingAddress.fullName.split(" ")[0],
              last_name:
                order.customer.lastName ||
                order.billingAddress.fullName.split(" ").slice(1).join(" "),
              line_1: order.billingAddress.address,
              city: order.billingAddress.city,
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
            .patch(order.orderId)
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
  createOrder: customerProcedure
    .input(createOrderSchema)
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<{ orderId: string; orderNumber: string }> => {
        try {
          const {
            shippingAddress,
            deliveryMethod,
            paymentMethod,
            selectedDeliveryZone,
            appliedCoupon,
          } = input;

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

          if (
            !validatedCart.cartItems ||
            validatedCart.cartItems.length === 0
          ) {
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

          // 6. Check for existing pending pesapal orders and delete them (single pending constraint)
          if (paymentMethod === "pesapal") {
            const existingPendingPesapalOrders = await client.fetch(
              groq`*[_type == "order" && customer->clerkUserId == $clerkUserId && paymentMethod == "pesapal" && paymentStatus in ["pending", "not_initiated"]]{
                _id,
                orderNumber,
                paymentMethod,
                paymentStatus,
                orderLevelDiscount,
                orderItems[] {
                  type,
                  quantity,
                  variantSku,
                  product->{_id, hasVariants, totalStock},
                  course->{_id}
                }
              }`,
              { clerkUserId: ctx.auth.userId }
            );

            if (existingPendingPesapalOrders.length > 0) {
              // Revert coupons and restore stock for orders before deletion
              for (const order of existingPendingPesapalOrders) {
                // Revert coupon usage
                if (order.orderLevelDiscount?.couponApplied) {
                  try {
                    const code = order.orderLevelDiscount.couponApplied.split(" ")[0];
                    const { couponRouter } = await import(
                      "@/features/coupons/server/procedure"
                    );
                    const couponCtx = {
                      auth: ctx.auth,
                      pesapalToken: ctx.pesapalToken,
                    } as any;
                    await couponRouter.createCaller(couponCtx).revertCouponUsage({
                      code,
                      orderNumber: order.orderNumber,
                    });
                  } catch (err) {
                    console.error("Failed to revert coupon usage:", err);
                  }
                }

                // Only restore stock for orders that actually had stock reduced
                if (order.orderItems?.length > 0) {
                  if (shouldRestoreStockForOrder(order)) {
                    try {
                      await restoreStockForOrder(order.orderItems);
                      console.log(`✓ Stock restored for deleted ${order.paymentMethod} order ${order.orderNumber} (was ${order.paymentStatus})`);
                    } catch (err) {
                      console.error("Failed to restore stock for deleted order:", err);
                    }
                  } else {
                    console.log(`ℹ Skipping stock restoration for ${order.paymentMethod} order ${order.orderNumber} (${order.paymentStatus}) - stock was never reduced`);
                  }
                }
              }

              // Delete all existing pending pesapal orders (we don't keep cancelled orders)
              await Promise.all(
                existingPendingPesapalOrders.map((order: any) =>
                  client.delete(order._id)
                )
              );
            }
          }

          // 7. Generate order number
          const orderNumber = generateOrderNumber();

          // 8. Generate coupon display text if coupon is applied
          let couponDisplayText = null;
          if (appliedCoupon) {
            // Create Amazon-style coupon display: "TEST20 20% OFF"
            couponDisplayText = `${appliedCoupon.code.toUpperCase()} ${appliedCoupon.originalPercentage}% OFF`;
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
                couponApplied: couponDisplayText,
                discountAmount: appliedCoupon.discountAmount,
              },
            }),
            total: totals.total,
            currency: "UGX",
            paymentStatus: paymentMethod === "pesapal" ? "not_initiated" : "pending",
            paymentMethod,
            status: paymentMethod === "cod" ? "PROCESSING" : "PENDING_PAYMENT",

            shippingAddress: { _type: "reference", _ref: addressId },
            deliveryMethod,
            estimatedDelivery: selectedDeliveryZone
              ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours for delivery
              : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days for pickup
          };

          // 11. Create order items as embedded objects
          const orderItems = validatedCart.cartItems.map((cartItem) => {
            let originalPrice = 0;
            let discountApplied = 0;
            let itemName = "";
            let variantSku = null;

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

                  // Generate Amazon-style name for variant
                  itemName = variant?.attributes
                    ? `${product.title} ${variant.attributes
                        .map((attr: any) => `${attr.name} - ${attr.value}`)
                        .join(", ")}`
                    : product.title;

                  variantSku = cartItem.selectedVariantSku;
                } else {
                  originalPrice = parseInt(product.price);
                  itemName = product.title;
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
                itemName = course.title;

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

            const unitPrice = originalPrice - discountApplied;
            const lineTotal = unitPrice * cartItem.quantity;

            return {
              _type: "orderItem",
              _key: nanoid(10),
              type: cartItem.type,
              name: itemName,
              ...(variantSku && { variantSku }),
              quantity: cartItem.quantity,
              originalPrice,
              discountApplied,
              unitPrice,
              lineTotal,
              ...(cartItem.type === "product" && {
                product: { _type: "reference", _ref: cartItem.productId },
              }),
              ...(cartItem.type === "course" && {
                course: { _type: "reference", _ref: cartItem.courseId },
                ...(cartItem.preferredStartDate && {
                  preferredStartDate: cartItem.preferredStartDate,
                }),
              }),
            };
          });

          // 12. Create order document with embedded order items
          const orderDocWithItems = {
            ...orderDoc,
            orderItems,
          };

          const createdOrder = await client.create(orderDocWithItems);

          // Reduce stock immediately for COD orders (Pesapal handled by webhook)
          if (paymentMethod === "cod") {
            await reduceStockForOrder(orderItems);
          }

          // 13. Clear the cart
          await client
            .patch(cart._id)
            .set({
              cartItems: [],
            })
            .commit();

          try {
            // Invalidate pages that depend on cart data
            revalidatePath("/", "layout"); // Invalidate layout cache (header with cart)
            revalidatePath("/checkout", "page"); // Invalidate checkout pages

            // Invalidate Sanity Live cache tags for cart queries
            revalidateTag("cart-items"); // Invalidate cart items queries
            revalidateTag("cart-display"); // Invalidate cart display data queries
          } catch (error) {
            console.error("Cache invalidation error:", error);
            // Don't fail the order creation if cache invalidation fails
          }

          // 15. Apply coupon if provided and track usage
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
              });
            } catch (error) {
              console.error("Failed to apply coupon:", error);
              // Don't fail the order creation if coupon tracking fails
            }
          }

          return {
            orderId: createdOrder._id,
            orderNumber,
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
      }
    ),

  /**
   * Update order status
   */
  updateOrderStatus: protectedProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { orderId, status, notes } = input;

        // Verify order ownership or admin access (fetch order items if cancelling for stock reversion)
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId && customer->clerkUserId == $clerkUserId][0]{
            _id,
            status,
            ${status === "CANCELLED_BY_ADMIN" || status === "CANCELLED_BY_USER" ? `paymentMethod,
            paymentStatus,
            orderItems[] {
              type,
              quantity,
              variantSku,
              product->{_id, hasVariants, totalStock},
              course->{_id}
            }` : ""}
          }`,
          { orderId, clerkUserId: ctx.auth.userId }
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found or access denied",
          });
        }

        // Only restore stock for orders that actually had stock reduced
        if (status === "CANCELLED_BY_ADMIN" || status === "CANCELLED_BY_USER" && order.orderItems?.length > 0) {
          if (shouldRestoreStockForOrder(order)) {
            try {
              await restoreStockForOrder(order.orderItems);
              console.log(`✓ Stock restored for cancelled ${order.paymentMethod} order (was ${order.paymentStatus})`);
            } catch (error) {
              console.error("Failed to restore stock for cancelled order:", error);
              // Don't fail the status update if stock restoration fails
            }
          } else {
            console.log(`ℹ Skipping stock restoration for cancelled ${order.paymentMethod} order (${order.paymentStatus}) - stock was never reduced`);
          }
        }

        const updateData: any = { status };

        if (notes) {
          updateData.notes = notes;
        }

        if (status === "DELIVERED") {
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
   * NOTE: This procedure has built-in protection against orderItems modification
   */
  updatePaymentStatus: baseProcedure
    .input(updatePaymentStatusSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { orderId, paymentStatus, transactionId, confirmationCode, paidAt } = input;

        // SECURITY: Explicitly prevent any orderItems modifications
        const updateData: any = {
          paymentStatus,
        };

        if (transactionId) {
          updateData.transactionId = transactionId;
        }

        if (confirmationCode) {
          updateData.confirmationCode = confirmationCode;
        }

        if (paidAt) {
          updateData.paidAt = paidAt;
        }

        // If payment is confirmed, update order status
        if (paymentStatus === "paid") {
          updateData.status = "PROCESSING";
          updateData.paidAt = paidAt || new Date().toISOString();
        }

        // Log all order updates for audit trail
        console.log(`🔒 Order update protection: Updating order ${orderId} with safe data only:`, updateData);

        const updatedOrder = await client
          .patch(orderId)
          .set(updateData)
          .commit();

        return updatedOrder;
      } catch (error) {
        console.error("❌ Order update failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update payment status",
        });
      }
    }),

  /**
   * Get user's orders
   */
  getUserOrders: customerProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
        timeRange: z.enum(["30days", "3months"]).or(z.string().regex(/^\d{4}$/)).optional(),
        searchQuery: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Build dynamic filter conditions
        let dateFilter = "";
        let searchFilter = "";
        
        if (input.timeRange) {
          const now = new Date();
          if (input.timeRange === "30days") {
            const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30)).toISOString();
            dateFilter = ` && orderDate >= "${thirtyDaysAgo}"`;
          } else if (input.timeRange === "3months") {
            const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3)).toISOString();
            dateFilter = ` && orderDate >= "${threeMonthsAgo}"`;
          } else if (/^\d{4}$/.test(input.timeRange)) {
            // Year filter
            const year = input.timeRange;
            dateFilter = ` && dateTime(orderDate) >= dateTime("${year}-01-01T00:00:00Z") && dateTime(orderDate) < dateTime("${parseInt(year) + 1}-01-01T00:00:00Z")`;
          }
        }
        
        if (input.searchQuery) {
          const searchTerm = input.searchQuery.toLowerCase();
          searchFilter = ` && (lower(orderNumber) match "*${searchTerm}*" || orderItems[lower(name) match "*${searchTerm}*"])`;
        }

        const orders = await client.fetch(
          groq`*[_type == "order" && customer->clerkUserId == $clerkUserId${dateFilter}${searchFilter}] | order(orderDate desc) [$offset...$limit] {
            "orderId": _id,
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
            deliveredAt,
            "userJoinDate": customer->_createdAt,
            orderItems[]{
              type,
              name,
              quantity,
              variantSku,
              image,
              // Get product/course images
              "itemImage": select(
                type == "product" => product->images[0],
                type == "course" => course->images[0],
                null
              ),
              // IDs for actions (buy again / write review)
              "productId": select(
                type == "product" => product->_id,
                null
              ),
              "courseId": select(
                type == "course" => course->_id,
                null
              )
            }
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

  // Count of user's orders for overview
  getUserOrdersCount: customerProcedure.query(async ({ ctx }) => {
    try {
      const count = await client.fetch(
        groq`count(*[_type == "order" && customer->clerkUserId == $clerkUserId])`,
        { clerkUserId: ctx.auth.userId }
      );
      return { count: Number(count) || 0 };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch order count",
      });
    }
  }),

  // Lightweight status fetcher for routing/decisions
  getOrderStatus: customerProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const meta = await client.fetch(
        groq`*[_type == "order" && _id == $orderId && customer->clerkUserId == $clerkUserId][0]{
          "orderId": _id,
          paymentMethod,
          paymentStatus,
          status,
          transactionId
        }`,
        { orderId: input.orderId, clerkUserId: ctx.auth.userId }
      );

      if (!meta) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      return orderMetaSchema.parse(meta);
    }),

  /**
   * Reset order for payment retry - sets order to initial payment state
   */
  resetOrderForPayment: customerProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { orderId } = input;

        // Verify order ownership
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

        // Reset order to initial payment state for checkout page
        const updatedOrder = await client
          .patch(orderId)
          .set({
            paymentStatus: "not_initiated",
            status: "PENDING_PAYMENT",
          })
          .unset(["transactionId", "paymentFailureReason"])
          .commit();

        return { success: true, order: updatedOrder };
      } catch (error) {
        console.error("Failed to reset order for payment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reset order for payment",
        });
      }
    }),

  /**
   * Cancel pending order (for checkout back button handling)
   */
  cancelPendingOrder: customerProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (!input.orderId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pending order not found or access denied",
          });
        }

        // Fetch order to get orderNumber, coupon info, and order items for revert
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId && customer->clerkUserId == $clerkUserId][0]{
            _id,
            orderNumber,
            paymentMethod,
            paymentStatus,
            orderLevelDiscount,
            orderItems[] {
              type,
              quantity,
              variantSku,
              product->{_id, hasVariants, totalStock},
              course->{_id}
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

        // If coupon was applied, revert its usage before deleting order
        const couponAppliedText: string | undefined =
          order.orderLevelDiscount?.couponApplied;
        if (couponAppliedText) {
          try {
            // couponApplied is like "TEST20 20% OFF" → extract code before first space
            const code = couponAppliedText.split(" ")[0];
            const { couponRouter } = await import(
              "@/features/coupons/server/procedure"
            );
            const couponCtx = {
              auth: ctx.auth,
              pesapalToken: ctx.pesapalToken,
            } as any;
            await couponRouter.createCaller(couponCtx).revertCouponUsage({
              code,
              orderNumber: order.orderNumber,
            });
          } catch (err) {
            console.error("Failed to revert coupon usage on cancel:", err);
          }
        }

        // Only restore stock for orders that actually had stock reduced
        if (order.orderItems?.length > 0) {
          if (shouldRestoreStockForOrder(order)) {
            try {
              await restoreStockForOrder(order.orderItems);
              console.log(`✓ Stock restored for cancelled ${order.paymentMethod} order ${order.orderNumber} (was ${order.paymentStatus})`);
            } catch (error) {
              console.error("Failed to restore stock for cancelled order:", error);
              // Don't fail the cancellation if stock restoration fails
            }
          } else {
            console.log(`ℹ Skipping stock restoration for cancelled ${order.paymentMethod} order ${order.orderNumber} (${order.paymentStatus}) - stock was never reduced`);
          }
        }

        await client.delete(input.orderId);

        return {
          success: true,
          message: "Pending order deleted successfully.",
        };
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
  getOrderById: customerProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId && customer->clerkUserId == $clerkUserId][0] {
            "orderId": _id,
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
            deliveredAt,
            transactionId,
            customer->{email, firstName, lastName},
            orderLevelDiscount,
            "billingAddress": shippingAddress->{_id, phone, address, city, fullName},
            orderItems[] {
              _key,
              type,
              name,
              variantSku,
              quantity,
              discountApplied,
              unitPrice,
              lineTotal,
              "image": coalesce(product->images[0], course->images[0]),
              "itemImage": select(
                type == "product" => product->images[0],
                type == "course" => course->images[0],
                null
              ),
              // IDs for actions (buy again / write review)
              "productId": select(
                type == "product" => product->_id,
                null
              ),
              "courseId": select(
                type == "course" => course->_id,
                null
              ),
              preferredStartDate
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

        const validatedOrder = orderSchema.parse(order);

        return validatedOrder;
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Schema validation error:", error.errors);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Invalid order data structure",
          });
        }
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch order",
        });
      }
    }),

  /**
   * Cancel confirmed/processing order (customer-initiated)
   */
  cancelConfirmedOrder: customerProcedure
    .input(customerCancelOrderSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { orderId, reason, notes } = input;

        // Verify order ownership and fetch order details
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId && customer->clerkUserId == $clerkUserId][0]{
            _id,
            status,
            orderNumber,
            paymentMethod,
            paymentStatus,
            orderHistory,
            orderItems[] {
              type,
              quantity,
              variantSku,
              product->{_id, hasVariants, totalStock},
              course->{_id}
            }
          }`,
          { orderId, clerkUserId: ctx.auth.userId }
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found or access denied",
          });
        }

        // Only allow cancellation for processing or ready for delivery orders
        if (!["PROCESSING", "READY_FOR_DELIVERY"].includes(order.status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Order cannot be cancelled at this stage. Only processing or ready for delivery orders can be cancelled.",
          });
        }

        if (order.status === "CANCELLED_BY_ADMIN" || order.status === "CANCELLED_BY_USER") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Order is already cancelled",
          });
        }

        // Restore stock for the cancelled order if applicable
        if (order.orderItems?.length > 0) {
          if (shouldRestoreStockForOrder(order)) {
            try {
              await restoreStockForOrder(order.orderItems);
              console.log(`✓ Stock restored for customer-cancelled ${order.paymentMethod} order ${order.orderNumber} (was ${order.paymentStatus})`);
            } catch (error) {
              console.error("Failed to restore stock for customer-cancelled order:", error);
              // Don't fail the cancellation if stock restoration fails
            }
          } else {
            console.log(`ℹ Skipping stock restoration for customer-cancelled ${order.paymentMethod} order ${order.orderNumber} (${order.paymentStatus}) - stock was never reduced`);
          }
        }

        // Create new history entry for customer cancellation
        const historyEntry = {
          _key: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: "CANCELLED_BY_USER",
          timestamp: new Date().toISOString(),
          adminId: null, // Customer cancellation
          notes: notes ? `Customer cancellation - ${reason}: ${notes}` : `Customer cancellation - ${reason}`,
        };

        // Update order to cancelled with customer notes and history
        const customerNotes = notes 
          ? `[CUSTOMER CANCELLATION - ${reason.toUpperCase().replace(/_/g, ' ')}] ${notes}`
          : `[CUSTOMER CANCELLATION - ${reason.toUpperCase().replace(/_/g, ' ')}]`;
        
        const currentHistory = order.orderHistory || [];

        const updatedOrder = await client
          .patch(orderId)
          .set({
            status: "CANCELLED_BY_USER",
            notes: customerNotes,
            cancelledAt: new Date().toISOString(),
            orderHistory: [...currentHistory, historyEntry],
          })
          .commit();

        return {
          success: true,
          message: "Order cancelled successfully",
          order: updatedOrder,
        };
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
