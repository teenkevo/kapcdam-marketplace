import { TRPCError } from "@trpc/server";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { z } from "zod";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { updateOrderStatusSchema, type OrderResponse } from "../schema";

const adminOrderFilterSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  status: z.enum([
    "all",
    "pending", 
    "confirmed", 
    "processing",
    "ready", 
    "shipped", 
    "delivered", 
    "cancelled"
  ]).default("all"),
  paymentStatus: z.enum([
    "all",
    "not_initiated",
    "pending", 
    "paid", 
    "failed", 
    "refunded"
  ]).default("all"),
  searchQuery: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const cancelOrderWithNotesSchema = z.object({
  orderId: z.string(),
  notes: z.string().min(1, "Cancellation notes are required"),
  reason: z.enum([
    "customer_request",
    "payment_failed", 
    "items_unavailable",
    "fraud_suspected",
    "other"
  ]).default("other"),
});

export const adminOrdersRouter = createTRPCRouter({
  /**
   * Get all orders for admin management
   */
  getAllOrders: baseProcedure
    .input(adminOrderFilterSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Build dynamic filter conditions
        let statusFilter = "";
        let paymentStatusFilter = "";
        let searchFilter = "";
        let dateFilter = "";

        if (input.status !== "all") {
          statusFilter = ` && status == "${input.status}"`;
        }

        if (input.paymentStatus !== "all") {
          paymentStatusFilter = ` && paymentStatus == "${input.paymentStatus}"`;
        }

        if (input.searchQuery) {
          const searchTerm = input.searchQuery.toLowerCase();
          searchFilter = ` && (
            lower(orderNumber) match "*${searchTerm}*" || 
            lower(customer->firstName) match "*${searchTerm}*" ||
            lower(customer->lastName) match "*${searchTerm}*" ||
            lower(customer->email) match "*${searchTerm}*" ||
            orderItems[lower(name) match "*${searchTerm}*"]
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
          groq`*[_type == "order"${statusFilter}${paymentStatusFilter}${searchFilter}${dateFilter}] | order(orderDate desc) [$offset...$limit] {
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
   * Get orders statistics for admin dashboard
   */
  getOrdersStats: baseProcedure.query(async ({ ctx }) => {
    try {
      const stats = await client.fetch(
        groq`{
          "totalOrders": count(*[_type == "order"]),
          "pendingOrders": count(*[_type == "order" && status == "pending"]),
          "confirmedOrders": count(*[_type == "order" && status == "confirmed"]),
          "processingOrders": count(*[_type == "order" && status == "processing"]),
          "deliveredOrders": count(*[_type == "order" && status == "delivered"]),
          "cancelledOrders": count(*[_type == "order" && status == "cancelled"]),
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
  updateOrderStatusAdmin: baseProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { orderId, status, notes } = input;

        // Fetch order without ownership check for admin
        const order = await client.fetch(
          groq`*[_type == "order" && _id == $orderId][0]{
            _id,
            status,
            paymentMethod,
            paymentStatus,
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

        const updateData: any = { status };

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
   * Cancel order with admin notes
   */
  cancelOrderWithNotes: baseProcedure
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

        if (order.status === "cancelled") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Order is already cancelled",
          });
        }

        // Update order to cancelled with admin notes
        const adminNotes = `[ADMIN CANCELLATION - ${reason.toUpperCase()}] ${notes}`;
        
        const updatedOrder = await client
          .patch(orderId)
          .set({
            status: "cancelled",
            notes: adminNotes,
            cancelledAt: new Date().toISOString(),
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

  /**
   * Get single order by ID for admin (no ownership check)
   */
  getOrderByIdAdmin: baseProcedure
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
});