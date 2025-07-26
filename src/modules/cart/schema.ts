import { SanityAsset } from "@sanity/image-url/lib/types/types";
import { z } from "zod";

const cartItemSchema = z.object({
  _key: z.string().optional(),
  type: z.enum(["product", "course"]),
  quantity: z.number().min(1),
  currentPrice: z.number(),
  addedAt: z.coerce.date(),
  lastUpdated: z.coerce.date(),
  selectedVariantSku: z.string().nullable().optional(),
  product: z
    .object({
      _id: z.string(),
      title: z.string(),
      price: z.string(),
      hasVariants: z.boolean(),
      totalStock: z.number().optional(),
      defaultImage: z.custom<SanityAsset>().nullable().optional(), // Handle null
      selectedVariant: z
        .object({
          sku: z.string(),
          price: z.string(),
          stock: z.number(),
          attributes: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              value: z.string(),
            })
          ),
        })
        .nullable()
        .optional(),
    })
    .optional(),
  course: z
    .object({
      _id: z.string(),
      title: z.string(),
      price: z.string(),
      defaultImage: z.custom<SanityAsset>().nullable().optional(), // Handle null
    })
    .optional(),
  preferredStartDate: z.coerce.date().nullable().optional(), // Handle null
});

const CartSchema = z.object({
  _id: z.string().optional(),
  cartItems: z.array(cartItemSchema),
  itemCount: z.number(),
  subtotal: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  isActive: z.boolean(),
});

const localCartItemSchema = z.object({
  type: z.enum(["product", "course"]),
  productId: z.string().optional(),
  courseId: z.string().optional(),
  selectedVariantSku: z.string().optional(),
  quantity: z.number().min(1),
  addedAt: z.coerce.date(),
  preferredStartDate: z.coerce.date().optional(),
  displayData: z
    .object({
      title: z.string(),
      price: z.number(),
      image: z.any().optional(),
    })
    .optional(),
});

const addToCartSchema = z
  .object({
    clerkUserId: z.string(),
    type: z.enum(["product", "course"]),
    productId: z.string().optional(),
    courseId: z.string().optional(),
    selectedVariantSku: z.string().optional(),
    quantity: z.number().min(1).default(1),
    preferredStartDate: z.coerce.date().optional(),
  })
  .refine((data) => {
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
  localCartItems: z.array(localCartItemSchema),
});

const variantSchema = z.object({
  sku: z.string(),
  price: z.string(),
  stock: z.string(),
  attributes: z
    .array(
      z.object({
        _id: z.string(),
        name: z.string(),
        value: z.string(),
      })
    )
    .nullable()
    .optional(),
});

export {
  CartSchema,
  addToCartSchema,
  updateCartItemSchema,
  cartItemSchema,
  syncCartSchema,
  localCartItemSchema,
  variantSchema,
};

export type LocalCartItemType = z.infer<typeof localCartItemSchema>;
export type AddToCartType = z.infer<typeof addToCartSchema>;
export type UpdateCartItemType = z.infer<typeof updateCartItemSchema>;
export type SyncCartType = z.infer<typeof syncCartSchema>;
export type CartType = z.infer<typeof CartSchema>;
export type VariantType = z.infer<typeof variantSchema>;