import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import {
  updateOrderStatusSchema,
  type OrderResponse,
  adminOrdersArraySchema,
  type AdminOrderResponse,
  reactivateOrderSchema,
  initiateRefundSchema,
  getPreviousStatus,
  isRefundableOrder,
  validateOrderStateTransition,
  ORDER_STATUSES,
} from "../schema";

// Map filter status values to canonical ORDER_STATUSES
function mapFilterStatusToCanonical(filterStatus: string): string | null {
  const statusMap: Record<string, string> = {
    pending: "PENDING_PAYMENT",
    processing: "PROCESSING",
    ready: "READY_FOR_DELIVERY",
    shipped: "OUT_FOR_DELIVERY",
    delivered: "DELIVERED",
    cancelled:
      '(status == "CANCELLED_BY_USER" || status == "CANCELLED_BY_ADMIN")',
  };

  return statusMap[filterStatus] || null;
}

const adminOrderFilterSchema = z.object({
  limit: z.number().min(1).max(200).default(20),
  offset: z.number().min(0).default(0),
  status: z
    .enum([
      "all",
      "pending",
      "processing",
      "ready",
      "shipped",
      "delivered",
      "cancelled",
    ])
    .default("all"),
  paymentStatus: z
    .enum(["all", "not_initiated", "pending", "paid", "failed", "refunded"])
    .default("all"),
  searchQuery: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const cancelOrderWithNotesSchema = z.object({
  orderId: z.string(),
  notes: z.string().min(1, "Cancellation notes are required"),
  reason: z
    .enum([
      "customer_request",
      "payment_failed",
      "items_unavailable",
      "fraud_suspected",
      "other",
    ])
    .default("other"),
});

// Clean and normalize order data from Sanity
function cleanOrderData(order: any) {
  return {
    ...order,
    subtotal: order.subtotal ?? 0,
    shippingCost: order.shippingCost ?? 0,
    total: order.total ?? 0,
    notes: order.notes ?? null,
    estimatedDelivery: order.estimatedDelivery ?? null,
    deliveredAt: order.deliveredAt ?? null,
    orderHistory: [], // Default empty array since field doesn't exist in Sanity yet
    customer: {
      ...order.customer,
      firstName: order.customer?.firstName ?? "",
      lastName: order.customer?.lastName ?? "",
    },
    orderItems: Array.isArray(order.orderItems)
      ? order.orderItems.map((item: any) => ({
          ...item,
          variantSku: item.variantSku ?? null,
          itemImage: item.itemImage ?? null,
          productId: item.productId ?? null,
          courseId: item.courseId ?? null,
        }))
      : [],
  };
}

export const adminOrdersRouter = createTRPCRouter({
  /**
   * Get all orders for admin management
   */
  getAllOrders: adminProcedure
    .input(adminOrderFilterSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Build dynamic filter conditions
        let statusFilter = "";
        let paymentStatusFilter = "";
        let searchFilter = "";
        let dateFilter = "";

        if (input.status !== "all") {
          const canonicalStatus = mapFilterStatusToCanonical(input.status);
          if (canonicalStatus) {
            if (input.status === "cancelled") {
              // Special handling for cancelled status which maps to a complex condition
              statusFilter = ` && ${canonicalStatus}`;
            } else {
              statusFilter = ` && status == "${canonicalStatus}"`;
            }
          }
        }

        if (input.paymentStatus !== "all") {
          paymentStatusFilter = ` && paymentStatus == "${input.paymentStatus}"`;
        }

        if (input.searchQuery) {
          const searchTerm = input.searchQuery.toLowerCase();
          searchFilter = ` && (
          lower(orderNumber) match "${searchTerm}*" || 
          lower(customer->firstName) match "${searchTerm}*" ||
          lower(customer->lastName) match "${searchTerm}*" ||
          lower(customer->email) match "${searchTerm}*" ||
          count(orderItems[lower(name) match "${searchTerm}*"]) > 0
        )`;
        }

        if (input.dateFrom && input.dateTo) {
          dateFilter = ` && orderDate >= "${input.dateFrom}" && orderDate <= "${input.dateTo}"`;
        } else if (input.dateFrom) {
          dateFilter = ` && orderDate >= "${input.dateFrom}"`;
        } else if (input.dateTo) {
          dateFilter = ` && orderDate <= "${input.dateTo}"`;
        }

        const orders = await client.fetch(
          groq`*[_type == "order"${statusFilter}${paymentStatusFilter}${searchFilter}${dateFilter}] | order(orderDate desc) [$offset...($offset + $limit)] {
          "orderId": _id,
          orderNumber,
          orderDate,
          subtotal,
          shippingCost, 
          total,
          paymentStatus,
          paymentMethod,
          confirmationCode,
          status,
          deliveryMethod,
          estimatedDelivery,
          deliveredAt,
          notes,
          customer->{
            _id,
            email, 
            firstName, 
            lastName,
            clerkUserId
          },
          "billingAddress": shippingAddress->{
            _id, 
            phone, 
            address, 
            city, 
            fullName
          },
          orderItems[]{
            _key,
            type,
            name,
            quantity,
            unitPrice,
            lineTotal,
            variantSku,
            "itemImage": select(
              type == "product" => product->images[0],
              type == "course" => course->images[0],
              null
            ),
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
            offset: input.offset,
            limit: input.limit,
          }
        );

        console.log("Raw orders from Sanity:", orders?.length, "orders");
        console.log("Sample raw order:", orders?.[0]);

        // Clean and normalize the order data
        const cleanedOrders = Array.isArray(orders)
          ? orders.map(cleanOrderData)
          : [];

        console.log("Cleaned orders:", cleanedOrders.length);
        console.log("Sample cleaned order:", cleanedOrders[0]);

        // Validate and parse the cleaned orders data using the admin schema
        const validatedOrders = adminOrdersArraySchema.parse(cleanedOrders);
        console.log("Successfully validated", validatedOrders.length, "orders");

        return validatedOrders;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch orders",
        });
      }
    }),

  /**
   * Get orders statistics for admin dashboard
   */
  getOrdersStats: adminProcedure.query(async ({ ctx }) => {
    try {
      const stats = await client.fetch(
        groq`{
          "totalOrders": count(*[_type == "order"]),
          "pendingOrders": count(*[_type == "order" && status == "PENDING_PAYMENT"]),
          "processingOrders": count(*[_type == "order" && status == "PROCESSING"]),
          "deliveredOrders": count(*[_type == "order" && status == "DELIVERED"]),
          "cancelledOrders": count(*[_type == "order" && (status == "CANCELLED_BY_USER" || status == "CANCELLED_BY_ADMIN")]),
          "pendingPayments": count(*[_type == "order" && paymentStatus == "pending"]),
          "failedPayments": count(*[_type == "order" && paymentStatus == "failed"]),
          "totalRevenue": sum(*[_type == "order" && paymentStatus == "paid"].total),
          "recentOrders": *[_type == "order"] | order(orderDate desc)[0...5] {
            orderNumber,
            total,
            status,
            orderDate,
            customer->{ firstName, lastName }
          }
        }`
      );

      return {
        ...stats,
        totalOrders: Number(stats.totalOrders) || 0,
        pendingOrders: Number(stats.pendingOrders) || 0,
        confirmedOrders: Number(stats.confirmedOrders) || 0,
        processingOrders: Number(stats.processingOrders) || 0,
        deliveredOrders: Number(stats.deliveredOrders) || 0,
        cancelledOrders: Number(stats.cancelledOrders) || 0,
        pendingPayments: Number(stats.pendingPayments) || 0,
        failedPayments: Number(stats.failedPayments) || 0,
        totalRevenue: Number(stats.totalRevenue) || 0,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch order statistics",
      });
    }
  }),

  /**
   * Update order status as admin (no ownership check)
   */
  updateOrderStatusAdmin: adminProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { orderId, status, notes, adminId } = input;

        // Fetch order without ownership check for admin
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId][0]{
            _id,
            status,
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
          { orderId }
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Create new history entry
        const historyEntry = {
          _key: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status,
          timestamp: new Date().toISOString(),
          adminId: adminId || "admin",
          notes: notes || null,
        };

        // Build update data
        const updateData: any = {
          status,
        };

        // Add history entry to existing history or create new array
        const currentHistory = order.orderHistory || [];
        updateData.orderHistory = [...currentHistory, historyEntry];

        if (notes) {
          updateData.notes = notes;
        }

        if (status === "DELIVERED") {
          updateData.deliveredAt = new Date().toISOString();
        }

        if (status === "CANCELLED_BY_ADMIN" || status === "CANCELLED_BY_USER") {
          updateData.cancelledAt = new Date().toISOString();
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
   * Cancel order with admin notes
   */
  cancelOrderWithNotes: adminProcedure
    .input(cancelOrderWithNotesSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { orderId, notes, reason } = input;

        // Fetch order without ownership check for admin
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId][0]{
            _id,
            status,
            orderNumber,
            paymentMethod,
            paymentStatus,
            total,
            orderHistory,
            customer->{
              _id,
              firstName,
              lastName,
              email
            },
            orderItems[] {
              type,
              quantity,
              variantSku,
              name,
              unitPrice,
              lineTotal,
              product->{_id, hasVariants, totalStock},
              course->{_id}
            }
          }`,
          { orderId }
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        if (
          order.status === "CANCELLED_BY_USER" ||
          order.status === "CANCELLED_BY_ADMIN"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Order is already cancelled",
          });
        }

        // Restore stock if it had been reduced
        try {
          const shouldRestore =
            order.paymentMethod === "cod" ||
            (order.paymentMethod === "pesapal" && order.paymentStatus === "paid");

          if (shouldRestore && Array.isArray(order.orderItems) && order.orderItems.length > 0) {
            const stockUpdates: Promise<unknown>[] = [];

            for (const item of order.orderItems) {
              if (item.type === "product" && item.product) {
                const quantity = item.quantity;
                if (item.product.hasVariants && item.variantSku) {
                  stockUpdates.push(
                    client
                      .patch(item.product._id)
                      .inc({ [`variants[sku == "${item.variantSku}"].stock`]: quantity })
                      .commit()
                  );
                } else if (!item.product.hasVariants && item.product.totalStock !== undefined) {
                  stockUpdates.push(
                    client.patch(item.product._id).inc({ totalStock: quantity }).commit()
                  );
                }
              }
            }

            if (stockUpdates.length > 0) {
              await Promise.all(stockUpdates);
              console.log(
                `✓ Stock restored for admin-cancelled ${order.paymentMethod} order ${order.orderNumber} (was ${order.paymentStatus})`
              );
            } else {
              console.log("No stock updates needed for this order");
            }
          } else {
            console.log(
              `ℹ Skipping stock restoration for admin-cancelled ${order.paymentMethod} order ${order.orderNumber} (${order.paymentStatus})`
            );
          }
        } catch (stockErr) {
          console.error("Failed to restore stock for admin-cancelled order:", stockErr);
          // Do not fail cancellation if stock restore fails
        }

        // Create new history entry for cancellation
        const historyEntry = {
          _key: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: "CANCELLED_BY_ADMIN",
          timestamp: new Date().toISOString(),
          adminId: "admin",
          notes: `Cancellation reason: ${reason}. ${notes}`,
        };

        // Update order to cancelled with admin notes and history
        const adminNotes = `[ADMIN CANCELLATION - ${reason.toUpperCase()}] ${notes}`;
        const currentHistory = order.orderHistory || [];

        const updatedOrder = await client
          .patch(orderId)
          .set({
            status: "CANCELLED_BY_ADMIN",
            notes: adminNotes,
            cancelledAt: new Date().toISOString(),
            orderHistory: [...currentHistory, historyEntry],
          })
          .commit();

        // Send cancellation email to customer
        try {
          const { sendOrderCancellationEmail } = await import(
            "../lib/email-utils"
          );

          const emailResult = await sendOrderCancellationEmail(
            updatedOrder,
            order.customer,
            process.env.ADMIN_EMAIL,
            reason,
            notes
          );

          if (emailResult.success) {
            console.log(
              `Order cancellation email sent for admin-cancelled order ${order.orderNumber}`
            );
          } else {
            console.warn(
              `Failed to send order cancellation email for admin-cancelled order ${order.orderNumber}`
            );
          }
        } catch (emailError) {
          console.error("Error sending order cancellation email:", emailError);
        }

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

  /**
   * Get single order by ID for admin (no ownership check)
   */
  getOrderByIdAdmin: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId][0] {
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
            notes,
            customer->{
              _id,
              email, 
              firstName, 
              lastName,
              clerkUserId,
              _createdAt
            },
            orderLevelDiscount,
            "billingAddress": shippingAddress->{
              _id, 
              phone, 
              address, 
              city, 
              fullName
            },
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
          { orderId: input.orderId }
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
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

  /**
   * Update product availability status
   */
  updateProductAvailability: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        variantSku: z.string().nullable().optional(),
        available: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { productId, variantSku, available } = input;
        const newStatus = available ? "active" : "archived";

        if (variantSku) {
          // Update specific variant availability by setting its stock to 0 or restoring it
          // For variants, we'll set stock to 0 to mark as unavailable, or restore stock if available
          const product = await client.fetch(
            groq`*[_type == "product" && _id == $productId][0]{
              variants[sku == $variantSku][0] { stock }
            }`,
            { productId, variantSku }
          );

          if (!product?.variants?.[0]) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Product variant not found",
            });
          }

          // If making unavailable, set stock to 0, if making available, restore to 1 (or keep current if > 0)
          const stockValue = available
            ? product.variants[0].stock > 0
              ? product.variants[0].stock
              : 1
            : 0;

          await client
            .patch(productId)
            .set({
              [`variants[sku == "${variantSku}"].stock`]: stockValue,
            })
            .commit();
        } else {
          // Update entire product status
          await client.patch(productId).set({ status: newStatus }).commit();
        }

        return { success: true, status: newStatus };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update product availability",
        });
      }
    }),

  /**
   * Reactivate a cancelled order
   */
  reactivateOrder: adminProcedure
    .input(reactivateOrderSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { orderId, notes } = input;

        // Fetch the cancelled order with its order history
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId][0]{
            _id,
            status,
            orderNumber,
            paymentMethod,
            paymentStatus,
            orderHistory
          }`,
          { orderId }
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        if (
          order.status !== "CANCELLED_BY_USER" &&
          order.status !== "CANCELLED_BY_ADMIN"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only cancelled orders can be reactivated",
          });
        }

        // Get previous status from order history
        const previousStatus = getPreviousStatus(order.orderHistory);

        if (!previousStatus) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot reactivate order - no previous status found in order history",
          });
        }

        // Create new history entry for reactivation
        const historyEntry = {
          _key: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: previousStatus,
          timestamp: new Date().toISOString(),
          adminId: input.adminId || "admin",
          notes: `Order reactivated. ${notes}`,
        };

        // Reactivate order to its previous status
        const reactivationNotes = `[ADMIN REACTIVATION] ${notes}`;
        const currentHistory = order.orderHistory || [];
        const updateData: any = {
          status: previousStatus,
          notes: reactivationNotes,
          reactivatedAt: new Date().toISOString(),
          orderHistory: [...currentHistory, historyEntry],
        };

        // Clear cancellation timestamp
        const updatedOrder = await client
          .patch(orderId)
          .set(updateData)
          .unset(["cancelledAt"])
          .commit();

        return {
          success: true,
          newStatus: previousStatus,
          order: updatedOrder,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reactivate order",
        });
      }
    }),

  /**
   * Initiate refund for an order
   */
  initiateRefund: adminProcedure
    .input(initiateRefundSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { orderId, refundType, amount, reason, notes } = input;

        // Fetch the order with confirmation code
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId][0]{
            _id,
            orderNumber,
            total,
            paymentStatus,
            paymentMethod,
            confirmationCode,
            status
          }`,
          { orderId }
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Validate that the order can be refunded
        const refundValidation = isRefundableOrder(
          order.paymentMethod,
          order.paymentStatus,
          order.confirmationCode
        );

        if (!refundValidation.canRefund) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: refundValidation.reason || "Order cannot be refunded",
          });
        }

        if (refundType === "partial") {
          if (!amount || amount <= 0 || amount > order.total) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid partial refund amount",
            });
          }
        }

        const refundAmount = refundType === "full" ? order.total : amount;
        const refundNotes = notes
          ? `[ADMIN REFUND - ${refundType.toUpperCase()}] ${reason}. Notes: ${notes}`
          : `[ADMIN REFUND - ${refundType.toUpperCase()}] ${reason}`;

        // Create refund record
        const refundData = {
          _type: "refund",
          orderId: orderId,
          orderNumber: order.orderNumber,
          refundType,
          amount: refundAmount,
          reason,
          status: "initiated", // initiated, processing, completed, failed
          notes: refundNotes,
          initiatedAt: new Date().toISOString(),
          initiatedBy: input.adminId || "admin",
        };

        // Create the refund document
        const refund = await client.create(refundData);

        // Update order payment status if full refund
        if (refundType === "full") {
          await client
            .patch(orderId)
            .set({
              paymentStatus: "refunded",
              refundId: refund._id,
              refundInitiatedAt: new Date().toISOString(),
            })
            .commit();
        } else {
          // For partial refunds, add refund reference but keep payment status as paid
          await client
            .patch(orderId)
            .set({
              partialRefundId: refund._id,
              partialRefundAmount: refundAmount,
              partialRefundInitiatedAt: new Date().toISOString(),
            })
            .commit();
        }

        return {
          success: true,
          refundId: refund._id,
          refundAmount,
          refundType,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initiate refund",
        });
      }
    }),

  /**
   * Process actual Pesapal refund using stored confirmation code
   */
  processPesapalRefund: adminProcedure
    .input(
      z.object({
        orderId: z.string(),
        amount: z.number(),
        reason: z.string(),
        adminUsername: z.string().default("Admin"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { orderId, amount, reason, adminUsername } = input;

        // Fetch order with confirmation code
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId][0]{
            _id,
            orderNumber,
            total,
            paymentStatus,
            paymentMethod,
            confirmationCode,
            transactionId
          }`,
          { orderId }
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Validate refund eligibility
        const refundValidation = isRefundableOrder(
          order.paymentMethod,
          order.paymentStatus,
          order.confirmationCode
        );

        if (!refundValidation.canRefund) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: refundValidation.reason || "Order cannot be refunded",
          });
        }

        // Get Pesapal token (you'll need to implement this based on your auth system)
        const pesapalToken = ctx.pesapalToken;
        if (!pesapalToken) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Pesapal authentication token not available",
          });
        }

        // Call Pesapal refund API
        const refundResponse = await fetch(
          `${process.env.PESAPAL_API_URL}/Transactions/RefundRequest`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${pesapalToken}`,
              Accept: "application/json",
            },
            body: JSON.stringify({
              confirmation_code: order.confirmationCode,
              amount: amount.toString(),
              username: adminUsername,
              remarks: reason,
            }),
          }
        );

        const refundResult = await refundResponse.json();

        if (!refundResponse.ok || refundResult.status !== "200") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: refundResult.message || "Pesapal refund request failed",
          });
        }

        // Update order with refund information
        await client
          .patch(orderId)
          .set({
            refundStatus: "processing",
            refundAmount: amount,
            refundInitiatedAt: new Date().toISOString(),
          })
          .commit();

        return {
          success: true,
          message:
            refundResult.message || "Refund request submitted successfully",
          refundAmount: amount,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Pesapal refund processing error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process Pesapal refund",
        });
      }
    }),
});
