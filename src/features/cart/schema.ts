import { z } from "zod";



const CartItemSchema = z.object({
  type: z.enum(["product", "course"]),
  productId: z.string().nullable().optional(),
  courseId: z.string().nullable().optional(),
  selectedVariantSku: z.string().nullable().optional(),
  quantity: z.number().min(1),
  addedAt: z.coerce.date(),
  preferredStartDate: z.coerce.date().nullable().optional(),
  currentPrice: z.number(),
});

const CartSchema = z.object({
  _id: z.string(),
  cartItems: z.array(CartItemSchema).default([]),
  itemCount: z.number().nullable().optional().default(0),
  subtotal: z.number().nullable().optional().default(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  isActive: z.boolean().default(true),
});

const addToCartSchema = CartItemSchema.refine((data) => {
  return (
    (data.type === "product" && data.productId) ||
    (data.type === "course" && data.courseId)
  );
}, "Product ID is required for products, Course ID is required for courses");

const updateCartItemSchema = z.object({
  cartId: z.string(),
  itemIndex: z.number(),
  quantity: z.number().min(0),
});

const syncCartSchema = z.object({
  localCartItems: z.array(CartItemSchema),
});

export {
  CartSchema,
  addToCartSchema,
  updateCartItemSchema,
  CartItemSchema,
  syncCartSchema,
};

export type CartItemType = z.infer<typeof CartItemSchema>;
export type AddToCartType = z.infer<typeof addToCartSchema>;
export type UpdateCartItemType = z.infer<typeof updateCartItemSchema>;
export type SyncCartType = z.infer<typeof syncCartSchema>;
export type CartType = z.infer<typeof CartSchema>;
