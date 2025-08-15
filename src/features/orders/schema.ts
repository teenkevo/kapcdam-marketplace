import { z } from "zod";

// Order creation input schema
export const createOrderSchema = z.object({
  shippingAddress: z.object({ addressId: z.string() }),
  deliveryMethod: z.enum(["pickup", "local_delivery"]),
  paymentMethod: z.enum(["pesapal", "cod"]),
  selectedDeliveryZone: z
    .object({
      _id: z.string(),
      zoneName: z.string(),
      fee: z.number(),
      estimatedDeliveryTime: z.string(),
    })
    .nullable()
    .optional(),
  appliedCoupon: z
    .object({
      code: z.string(),
      discountAmount: z.number(),
      originalPercentage: z.number(),
    })
    .nullable()
    .optional(),
});

// Order history entry schema
const orderHistoryEntrySchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "ready",
    "shipped", 
    "delivered",
    "cancelled",
  ]),
  timestamp: z.string().datetime(),
  adminId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// Order status update schema
export const updateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "ready",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  notes: z.string().nullable().optional(),
  adminId: z.string().nullable().optional(),
});

// Payment status update schema
export const updatePaymentStatusSchema = z.object({
  orderId: z.string(),
  paymentStatus: z.enum([
    "pending",
    "paid",
    "failed",
    "refunded",
    "not_initiated",
  ]),
  transactionId: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
});

// Schema for the billing address
const billingAddressSchema = z.object({
  _id: z.string(),
  address: z.string(),
  city: z.string(),
  fullName: z.string(),
  phone: z.string(),
});

// Schema for the customer details
const customerSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
});

// Schema for a single item within the order (embedded object with _key)
const orderItemSchema = z.object({
  _key: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  lineTotal: z.number(),
  type: z.enum(["product", "course"]),
  discountApplied: z.number(),
  image: z.any().nullable(),
  itemImage: z.any().nullable(),
  productId: z.string().nullable(),
  courseId: z.string().nullable(),
  preferredStartDate: z.string().datetime().nullable(),
  variantSku: z.string().nullable(),
});

export const orderSchema = z.object({
  orderId: z.string(),
  billingAddress: billingAddressSchema,
  customer: customerSchema,
  deliveryMethod: z.string(),

  estimatedDelivery: z.string().datetime().nullable().optional(),
  deliveredAt: z.string().datetime().nullable().optional(),
  orderDate: z.string().datetime(),
  subtotal: z.number().optional(),
  shippingCost: z.number().optional(),
  orderItems: z.array(orderItemSchema),
  orderLevelDiscount: z
    .object({
      couponApplied: z.string(),
      discountAmount: z.number(),
    })
    .nullable()
    .optional(),
  orderNumber: z.string(),
  paymentMethod: z.string(),
  paymentStatus: z.enum([
    "pending",
    "paid",
    "failed",
    "refunded",
    "not_initiated",
  ]),
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  total: z.number(),
  transactionId: z.string().nullable(),
});

// Types
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<
  typeof updatePaymentStatusSchema
>;
export type OrderResponse = z.infer<typeof orderSchema>;

// Lightweight order meta for routing/decision
export const orderMetaSchema = z.object({
  orderId: z.string(),
  paymentMethod: z.enum(["pesapal", "cod"]),
  paymentStatus: z.enum([
    "not_initiated",
    "pending",
    "paid",
    "failed",
    "refunded",
  ]),
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  transactionId: z.string().nullable(),
});
export type OrderMeta = z.infer<typeof orderMetaSchema>;

// Admin-specific schemas for the getAllOrders endpoint

// Sanity image schema for order items
const sanityImageSchema = z.object({
  _key: z.string(),
  _type: z.literal("image"),
  asset: z.object({
    _ref: z.string(),
    _type: z.literal("reference"),
  }),
  isDefault: z.boolean().optional(),
});

// Admin order item schema (matches admin endpoint response)
const adminOrderItemSchema = z.object({
  _key: z.string(),
  type: z.enum(["product", "course"]),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  lineTotal: z.number(),
  variantSku: z.string().nullable(),
  itemImage: sanityImageSchema.nullable(),
  productId: z.string().nullable(),
  courseId: z.string().nullable(),
});

// Admin customer schema (includes clerk fields)
const adminCustomerSchema = z.object({
  _id: z.string(),
  clerkUserId: z.string(),
  email: z.string().email(),
  firstName: z.string(), // Can be empty string
  lastName: z.string(),  // Can be empty string
});

// Admin billing address schema
const adminBillingAddressSchema = z.object({
  _id: z.string(),
  address: z.string(),
  city: z.string(),
  fullName: z.string(),
  phone: z.string(),
});

// Main admin order schema
export const adminOrderSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  orderDate: z.string().datetime(),
  subtotal: z.number(),
  shippingCost: z.number(),
  total: z.number(),
  paymentStatus: z.enum([
    "not_initiated",
    "pending",
    "paid",
    "failed",
    "refunded",
  ]),
  paymentMethod: z.enum(["pesapal", "cod"]),
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "ready",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  deliveryMethod: z.enum(["pickup", "local_delivery"]),
  estimatedDelivery: z.string().datetime().nullable(),
  deliveredAt: z.string().datetime().nullable(),
  notes: z.string().nullable(),
  customer: adminCustomerSchema,
  billingAddress: adminBillingAddressSchema,
  orderItems: z.array(adminOrderItemSchema),
  orderHistory: z.array(orderHistoryEntrySchema).optional().default([]),
});

// Admin orders array schema
export const adminOrdersArraySchema = z.array(adminOrderSchema);

// Order reactivation schema
export const reactivateOrderSchema = z.object({
  orderId: z.string(),
  notes: z.string().nullable().optional(),
  adminId: z.string().nullable().optional(),
});

// Customer cancellation schema
export const customerCancelOrderSchema = z.object({
  orderId: z.string(),
  reason: z.enum([
    "changed_mind",
    "found_better_price", 
    "no_longer_needed",
    "ordered_by_mistake",
    "delivery_too_long",
    "other"
  ]),
  notes: z.string().nullable().optional(),
});

// Refund schemas
export const initiateRefundSchema = z.object({
  orderId: z.string(),
  refundType: z.enum(["full", "partial"]),
  amount: z.number().optional(), // Required for partial refunds
  reason: z.string(),
  notes: z.string().nullable().optional(),
  adminId: z.string().nullable().optional(),
});

// Admin order types
export type AdminOrderResponse = z.infer<typeof adminOrderSchema>;
export type AdminOrderItem = z.infer<typeof adminOrderItemSchema>;
export type AdminCustomer = z.infer<typeof adminCustomerSchema>;
export type AdminBillingAddress = z.infer<typeof adminBillingAddressSchema>;
export type SanityImage = z.infer<typeof sanityImageSchema>;
export type OrderHistoryEntry = z.infer<typeof orderHistoryEntrySchema>;
export type ReactivateOrderInput = z.infer<typeof reactivateOrderSchema>;
export type InitiateRefundInput = z.infer<typeof initiateRefundSchema>;
export type CustomerCancelOrderInput = z.infer<typeof customerCancelOrderSchema>;

// Helper function to get previous status from order history
export function getPreviousStatus(orderHistory?: OrderHistoryEntry[]): string | null {
  if (!orderHistory || orderHistory.length < 2) {
    return null;
  }
  // Return the second-to-last status
  return orderHistory[orderHistory.length - 2].status;
}
