import { z } from "zod";
import { addressSchema } from "@/features/checkout/schemas/checkout-form";

// Order creation input schema
export const createOrderSchema = z.object({
  shippingAddress: z.object({ addressId: z.string() }), // Only existing addresses
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

// Order response schema
export const orderResponseSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  total: z.number(),
  paymentRequired: z.boolean(),
  paymentMethod: z.enum(["pesapal", "cod"]),
  shippingAddress: z.object({
    addressId: z.string(),
  }),
  user: z.object({
    email: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
  }),
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
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded", "partial"]),
  transactionId: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
});

// Order item for creation (handling Sanity's nullable behavior)
export const orderItemSchema = z.object({
  type: z.enum(["product", "course"]),
  quantity: z.number().min(1),
  originalPrice: z.number(),
  discountApplied: z.number().default(0),
  finalPrice: z.number(),
  lineTotal: z.number(),
  productId: z.string().nullable().optional(),
  courseId: z.string().nullable().optional(),
  selectedVariantSku: z.string().nullable().optional(),
  preferredStartDate: z.string().nullable().optional(),
  // Snapshots for historical data
  productSnapshot: z
    .object({
      title: z.string(),
      sku: z.string().nullable().optional(),
      variantInfo: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  courseSnapshot: z
    .object({
      title: z.string(),
      description: z.string().nullable().optional(),
      duration: z.string().nullable().optional(),
      skillLevel: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

// Sanity order schema for parsing returned data
export const sanityOrderSchema = z.object({
  _id: z.string(),
  orderNumber: z.string(),
  orderDate: z.string(),
  customer: z.object({
    _ref: z.string(),
    _type: z.literal("reference"),
  }),
  subtotal: z.number(),
  tax: z.number().nullable().default(0),
  shippingCost: z.number().nullable().default(0),
  totalItemDiscounts: z.number().nullable().default(0),
  orderLevelDiscount: z
    .object({
      discountCode: z
        .object({
          _ref: z.string(),
          _type: z.literal("reference"),
        })
        .nullable()
        .optional(),
      discountAmount: z.number(),
      originalPercentage: z.number(),
      appliedAt: z.string(),
    })
    .nullable()
    .optional(),
  total: z.number(),
  currency: z.string().default("UGX"),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded", "partial"]),
  paymentMethod: z.enum(["pesapal", "cod"]),
  transactionId: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  shippingAddress: z.object({
    _id: z.string(),
    label: z.enum(["home", "work", "other"]),
    fullName: z.string(),
    phone: z.string(),
    address: z.string(),
    landmark: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().default("Uganda"),
    deliveryInstructions: z.string().nullable().optional(),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  deliveryMethod: z.enum(["pickup", "local_delivery"]),
  estimatedDelivery: z.string().nullable().optional(),
  deliveredAt: z.string().nullable().optional(),
});

// Types
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderResponse = z.infer<typeof orderResponseSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<
  typeof updatePaymentStatusSchema
>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type SanityOrder = z.infer<typeof sanityOrderSchema>;
