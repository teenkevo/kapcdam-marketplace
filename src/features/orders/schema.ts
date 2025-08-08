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

// Order status update schema
export const updateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  notes: z.string().nullable().optional(),
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
  preferredStartDate: z.string().datetime().nullable(),
  variantSku: z.string().nullable(),
});

export const orderSchema = z.object({
  orderId: z.string(),
  billingAddress: billingAddressSchema,
  customer: customerSchema,
  deliveryMethod: z.string(),

  estimatedDelivery: z.string().datetime(),
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
