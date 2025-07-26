import { z } from "zod";

// const cartItemSchema = z.object({
//   _key: z.string().optional(),
//   type: z.enum(["product", "course"]),
//   quantity: z.number().min(1),
//   currentPrice: z.number(),
//   addedAt: z.coerce.date(),
//   lastUpdated: z.coerce.date(),
//   selectedVariantSku: z.string().nullable().optional(),
//   product: z
//     .object({
//       _id: z.string(),
//       title: z.string(),
//       price: z.string(),
//       hasVariants: z.boolean(),
//       totalStock: z.number().optional(),
//       defaultImage: z.string(), // Handle null
//       selectedVariant: z
//         .object({
//           sku: z.string(),
//           price: z.string(),
//           stock: z.number(),
//           attributes: z.array(
//             z.object({
//               id: z.string(),
//               name: z.string(),
//               value: z.string(),
//             })
//           ),
//         })
//         .nullable()
//         .optional(),
//     })
//     .optional(),
//   course: z
//     .object({
//       _id: z.string(),
//       title: z.string(),
//       price: z.string(),
//       defaultImage: z.custom<SanityAsset>().nullable().optional(), // Handle null
//     })
//     .optional(),
//   preferredStartDate: z.coerce.date().nullable().optional(), // Handle null
// });

const CartItemSchema = z.object({
  type: z.enum(["product", "course"]),
  productId: z.string().optional(),
  courseId: z.string().optional(),
  selectedVariantSku: z.string().optional(),
  quantity: z.number().min(1),
  addedAt: z.coerce.date(),
  preferredStartDate: z.coerce.date().optional(),
  currentPrice: z.number(),
});

const CartSchema = z.object({
  _id: z.string().optional(),
  cartItems: z.array(CartItemSchema),
  itemCount: z.number(),
  subtotal: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  isActive: z.boolean(),
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
