import { z } from "zod";
import { SanityAsset } from "@sanity/image-url/lib/types/types";
import { courseListItemSchema } from "@/features/courses/schemas";

// Sanity specific schemas
const sanitySlugSchema = z.object({
  _type: z.literal("slug").optional(),
  current: z.string(),
});

const sanityAssetSchema = z.custom<SanityAsset>((val) => {
  return typeof val === "object" && val !== null && "_type" in val;
});

// Category schemas
const baseCategorySchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: sanitySlugSchema,
});

const parentCategorySchema = baseCategorySchema;

const categorySchema = baseCategorySchema.extend({
  hasParent: z.boolean().optional().nullable(),
  parent: parentCategorySchema.optional().nullable(),
  displayImage: sanityAssetSchema.optional().nullable(),
});

// Variant attribute schema
const variantAttributeSchema = z.object({
  attributeName: z.string(),
  attributeCode: z.string(),
  value: z.string(),
});

// Product variant schema
const productVariantSchema = z.object({
  sku: z.string(),
  price: z.string(),
  stock: z
    .number()
    .nullable()
    .transform((val) => val ?? 0),
  isDefault: z.boolean(),
  attributes: z.array(variantAttributeSchema),
});

// Discount info schema - only present when discount exists and is active
const discountInfoSchema = z
  .object({
    value: z.number(),
    isActive: z.boolean(),
    title: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
  })
  .nullable();

// Product list item schema (for getMany)
const productListItemSchema = z.object({
  _id: z.string(),
  title: z.string(),
  slug: sanitySlugSchema,
  hasVariants: z.boolean(),
  status: z.enum(["draft", "active", "archived"]),
  defaultImage: sanityAssetSchema.optional().nullable(),
  price: z.string(),
  totalStock: z.number(),
  averageRating: z.number().optional().nullable(),
  totalReviews: z.number(),
  category: categorySchema,
  variantOptions: z.array(productVariantSchema),
  hasDiscount: z.boolean().nullable().optional(),
  discountInfo: discountInfoSchema.optional().nullable(),
});

// Product detail schema (for getOne)
const productDetailSchema = productListItemSchema.extend({
  variants: z.array(productVariantSchema).nullable(),
  images: z.array(sanityAssetSchema).nullable(),
  detailedDescription: z.any().nullable(), // PortableText content
});

// Response schemas
const productsResponseSchema = z.object({
  items: z.array(productListItemSchema),
  total: z.number(),
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
});

const categoriesResponseSchema = z.array(categorySchema);

const getManyProductsInputSchema = z.object({
  type: z.enum(["all", "products", "courses"]).default("all"),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(50).default(12),
  search: z.string().nullish(),
  categoryId: z.string().nullish(),
  minPrice: z.number().min(0).nullish(),
  maxPrice: z.number().min(0).nullish(),
  sortBy: z
    .enum([
      "newest",
      "oldest",
      "price-asc",
      "price-desc",
      "name-asc",
      "name-desc",
      "relevance",
    ])
    .default("newest"),
  status: z.enum(["draft", "active", "archived"]).default("active"),
});

const getOneProductInputSchema = z.object({
  slug: z.string(),
});

const getRelatedProductsInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  categoryId: z.string().optional(),
  limit: z.number().min(1).max(8).default(4),
});

const priceRangeSchema = z.object({
  minPrice: z.number(),
  maxPrice: z.number(),
});

// Unified item schemas for mixed products and courses
const unifiedProductItemSchema = productListItemSchema.extend({
  itemType: z.literal("product"),
});

const unifiedCourseItemSchema = courseListItemSchema.extend({
  itemType: z.literal("course"),
  // Map course fields to match product structure for consistency
  totalStock: z.literal(1).default(1), // Courses are always "in stock"
  hasVariants: z.literal(false).default(false),
  variantOptions: z.array(z.any()).default([]),
  category: z.null().default(null), // Courses don't have categories
});

const unifiedItemSchema = z.discriminatedUnion("itemType", [
  unifiedProductItemSchema,
  unifiedCourseItemSchema,
]);

const unifiedResponseSchema = z.object({
  items: z.array(unifiedItemSchema),
  total: z.number(),
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
});

export {
  // Base schemas
  sanitySlugSchema,
  sanityAssetSchema,
  categorySchema,
  variantAttributeSchema,
  productVariantSchema,
  discountInfoSchema,

  // Product schemas
  productListItemSchema,
  productDetailSchema,

  // Response schemas
  productsResponseSchema,
  categoriesResponseSchema,

  // Unified schemas
  unifiedItemSchema,
  unifiedProductItemSchema,
  unifiedCourseItemSchema,
  unifiedResponseSchema,

  // Input schemas
  getManyProductsInputSchema,
  getOneProductInputSchema,
  getRelatedProductsInputSchema,
  priceRangeSchema,
};

export type SanitySlug = z.infer<typeof sanitySlugSchema>;
export type Category = z.infer<typeof categorySchema>;
export type VariantAttribute = z.infer<typeof variantAttributeSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type DiscountInfo = z.infer<typeof discountInfoSchema>;
export type ProductListItem = z.infer<typeof productListItemSchema>;
export type ProductDetail = z.infer<typeof productDetailSchema>;
export type ProductsResponse = z.infer<typeof productsResponseSchema>;
export type CategoriesResponse = z.infer<typeof categoriesResponseSchema>;

// Unified types
export type UnifiedItem = z.infer<typeof unifiedItemSchema>;
export type UnifiedProductItem = z.infer<typeof unifiedProductItemSchema>;
export type UnifiedCourseItem = z.infer<typeof unifiedCourseItemSchema>;
export type UnifiedResponse = z.infer<typeof unifiedResponseSchema>;

export type GetManyProductsInput = z.infer<typeof getManyProductsInputSchema>;
export type GetOneProductInput = z.infer<typeof getOneProductInputSchema>;
export type GetRelatedProductsInput = z.infer<
  typeof getRelatedProductsInputSchema
>;
export type PriceRange = z.infer<typeof priceRangeSchema>;

// Validation helpers
export const validateProductsResponse = (data: unknown): ProductsResponse => {
  return productsResponseSchema.parse(data);
};

export const validateUnifiedResponse = (data: unknown): UnifiedResponse => {
  return unifiedResponseSchema.parse(data);
};

export const validateProductDetail = (data: unknown): ProductDetail => {
  return productDetailSchema.parse(data);
};

export const validateCategoriesResponse = (
  data: unknown
): CategoriesResponse => {
  return categoriesResponseSchema.parse(data);
};
