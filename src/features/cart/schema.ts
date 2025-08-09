import { z } from "zod";

// Display schemas for cart UI rendering (unchanged)
const CartDisplayProductSchema = z.object({
  _id: z.string(),
  title: z.string(),
  price: z.string().nullable().optional(),
  hasVariants: z.boolean(),
  totalStock: z.number().nullable().optional(),
  defaultImage: z.string(),
  hasDiscount: z.boolean().nullable().optional(),
  discountInfo: z
    .object({
      value: z.number(),
      isActive: z.boolean(),
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      title: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
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
  hasDiscount: z.boolean().nullable().optional(),
  discountInfo: z
    .object({
      value: z.number(),
      isActive: z.boolean(),
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      title: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

// Core cart item schema - matches CART_ITEMS_QUERY structure exactly
const CartItemSchema = z.object({
  type: z.enum(["product", "course"]),
  quantity: z.number().min(1),
  productId: z.string().nullable().optional(),
  selectedVariantSku: z.string().nullable().optional(),
  courseId: z.string().nullable().optional(),
  preferredStartDate: z.string().nullable().optional(),
});

// Cart schema - matches Sanity schema exactly
const CartSchema = z.object({
  _id: z.string(),
  cartItems: z.array(CartItemSchema).default([]),
});

// Local cart item for localStorage (before sync to server)
const LocalCartItemSchema = z.object({
  type: z.enum(["product", "course"]),
  quantity: z.number().min(1),
  productId: z.string().nullable().optional(),
  selectedVariantSku: z.string().nullable().optional(),
  courseId: z.string().nullable().optional(),
  preferredStartDate: z.string().nullable().optional(),
});

// Input schemas for tRPC procedures
const addToCartSchema = LocalCartItemSchema.refine((data) => {
  return (
    (data.type === "product" && data.productId) ||
    (data.type === "course" && data.courseId)
  );
}, "Product ID is required for products, Course ID is required for courses");

const updateCartItemSchema = z.object({
  cartId: z.string(),
  itemIndex: z.number(),
  quantity: z.number().min(0), // 0 = remove item
});

// Sync schema for localStorage → server cart
const syncCartSchema = z.object({
  localCartItems: z.array(LocalCartItemSchema),
});

// Export schemas and types
export {
  CartSchema,
  addToCartSchema,
  updateCartItemSchema,
  CartItemSchema,
  LocalCartItemSchema,
  syncCartSchema,
  CartDisplayProductSchema,
  CartDisplayCourseSchema,
};

export type CartItemType = z.infer<typeof CartItemSchema>;
export type LocalCartItemType = z.infer<typeof LocalCartItemSchema>;
export type AddToCartType = z.infer<typeof addToCartSchema>;
export type UpdateCartItemType = z.infer<typeof updateCartItemSchema>;
export type SyncCartType = z.infer<typeof syncCartSchema>;
export type CartType = z.infer<typeof CartSchema>;
export type CartDisplayProductType = z.infer<typeof CartDisplayProductSchema>;
export type CartDisplayCourseType = z.infer<typeof CartDisplayCourseSchema>;
