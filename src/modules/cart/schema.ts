import { SanityAsset } from "@sanity/image-url/lib/types/types";
import { z } from "zod";

const cartItemSchema = z.object({
  type: z.enum(["product", "course"]),
  quantity: z.number().min(1),
  currentPrice: z.number(),
  addedAt: z.coerce.date(), 
  lastUpdated: z.coerce.date(),
  product: z
    .object({
      _id: z.string(),
      title: z.string(),
      price: z.string(), 
      hasVariants: z.boolean(),
      defaultImage: z.custom<SanityAsset>().optional(),
      totalStock: z.number().optional(), 
      selectedVariant: z
        .object({
          _id: z.string(),
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
        .optional(),
    })
    .optional(),
  course: z
    .object({
      _id: z.string(),
      title: z.string(),
      price: z.number(),
      defaultImage: z.custom<SanityAsset>().optional(),
    })
    .optional(),
  preferredStartDate: z.coerce.date().optional(),
});

const CartSchema = z.object({
  _id: z.string(),
  cartItems: z.array(cartItemSchema),
  itemCount: z.number(),
  subtotal: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  isActive: z.boolean(),
});


const addToCartSchema = z
  .object({
    clerkUserId: z.string(),
    type: z.enum(["product", "course"]),
    productId: z.string().optional(),
    courseId: z.string().optional(),
    variantId: z.string().optional(),
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

export { CartSchema, addToCartSchema, updateCartItemSchema, cartItemSchema };
