import { z } from "zod";

const SanityImageSchema = z.object({
  asset: z.object({
    _ref: z.string(),
    _type: z.literal("reference"),
  }).optional(),
  hotspot: z.any().optional(),
  crop: z.any().optional(),
  isDefault: z.boolean().optional(),
  _type: z.literal("image"),
  _key: z.string(),
});

const ProductVariantSchema = z.object({
  _type: z.literal("productVariant"),
  _key: z.string(),
  sku: z.string().optional(),
  attributes: z.array(z.object({
    attributeRef: z.object({
      _ref: z.string(),
      _type: z.literal("reference"),
    }).optional(),
    value: z.string().optional(),
    _key: z.string(),
  })).optional(),
  price: z.string().optional(),
  totalStock: z.number().optional(),
  isDefault: z.boolean().optional(),
});

const CategorySchema = z.object({
  _id: z.string(),
  _type: z.literal("category"),
  name: z.string(),
  slug: z.object({
    current: z.string(),
    _type: z.literal("slug"),
  }).optional(),
  description: z.string().optional(),
});

export const EnhancedProductSchema = z.object({
  _id: z.string(),
  _type: z.literal("product"),
  _createdAt: z.string().optional(),
  _updatedAt: z.string().optional(),
  _rev: z.string().optional(),
  title: z.string().optional(),
  slug: z.object({
    current: z.string(),
    _type: z.literal("slug"),
  }).optional(),
  category: CategorySchema.optional(),
  detailedDescription: z.any().optional(),
  hasVariants: z.boolean().optional(),
  variants: z.array(ProductVariantSchema).optional(),
  price: z.string().optional(),
  totalStock: z.number().optional(),
  images: z.array(SanityImageSchema).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  discount: z.object({
    value: z.number().optional(),
    isActive: z.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    title: z.string().optional(),
  }).optional(),
  defaultImage: SanityImageSchema.optional(),
  defaultVariant: ProductVariantSchema.optional(),
  rating: z.number().optional(),
  totalReviews: z.number().optional(),
});

export const ProductsResponseSchema = z.object({
  items: z.array(EnhancedProductSchema),
  total: z.number(),
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
});

export const SingleProductSchema = EnhancedProductSchema;

export type EnhancedProduct = z.infer<typeof EnhancedProductSchema>;
export type ProductsResponse = z.infer<typeof ProductsResponseSchema>;
export type SingleProduct = z.infer<typeof SingleProductSchema>;