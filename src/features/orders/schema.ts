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
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded", "initiated", "not_initiated"]),
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

// Schema for a single item within the order
const orderItemSchema = z.object({
  _id: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  lineTotal: z.number(),
  type: z.enum(["product", "course"]),
  fulfillmentStatus: z.enum(["pending", "fulfilled", "shipped", "cancelled"]),
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
  orderItems: z.array(orderItemSchema),
  orderLevelDiscount: z.number().nullable(),
  orderNumber: z.string(),
  paymentMethod: z.string(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded", "initiated", "not_initiated"]),
  status: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  total: z.number(),
  transactionId: z.string().uuid().nullable(),
});

// Types
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<
  typeof updatePaymentStatusSchema
>;
export type OrderResponse = z.infer<typeof orderSchema>;
