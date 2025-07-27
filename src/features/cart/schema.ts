import { z } from "zod";

const CartDisplayProductSchema = z.object({
  _id: z.string(),
  title: z.string(),
  price: z.string().nullable().optional(),
  hasVariants: z.boolean(),
  totalStock: z.number().nullable().optional(),
  defaultImage: z.string(),
  variants: z
    .array(
      z.object({
        sku: z.string(),
        price: z.number(),
        totalStock: z.number(),
        isDefault: z.boolean(),
        attributes: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            value: z.string(),
          })
        ),
      })
    )
    .nullable()
    .optional(),
});

const CartDisplayCourseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  price: z.string(),
  defaultImage: z.string(),
});

const CartItemSchema = z.object({
  type: z.enum(["product", "course"]),
  productId: z.string().nullable().optional(),
  courseId: z.string().nullable().optional(),
  selectedVariantSku: z.string().nullable().optional(),
  quantity: z.number().min(1),
  addedAt: z.coerce.date(),
  preferredStartDate: z.coerce.date().nullable().optional(),
});

const CartSchema = z.object({
  _id: z.string(),
  cartItems: z.array(CartItemSchema).default([]),
  itemCount: z.number().nullable().optional().default(0),
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
  CartDisplayProductSchema,
  CartDisplayCourseSchema,
};

export type CartItemType = z.infer<typeof CartItemSchema>;
export type AddToCartType = z.infer<typeof addToCartSchema>;
export type UpdateCartItemType = z.infer<typeof updateCartItemSchema>;
export type SyncCartType = z.infer<typeof syncCartSchema>;
export type CartType = z.infer<typeof CartSchema>;
export type CartDisplayProductType = z.infer<typeof CartDisplayProductSchema>;
export type CartDisplayCourseType = z.infer<typeof CartDisplayCourseSchema>;  
