import { z } from "zod";
import { SanityAsset } from "@sanity/image-url/lib/types/types";

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
  variants: z.array(productVariantSchema),
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
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(20).default(10),
  search: z.string().nullish(),
  categoryId: z.string().nullish(),
  status: z.enum(["draft", "active", "archived"]).default("active"),
  lastId: z.string().nullish(),
});

const getOneProductInputSchema = z.object({
  slug: z.string(),
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

  // Input schemas
  getManyProductsInputSchema,
  getOneProductInputSchema,
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
export type GetManyProductsInput = z.infer<typeof getManyProductsInputSchema>;
export type GetOneProductInput = z.infer<typeof getOneProductInputSchema>;

// Validation helpers
export const validateProductsResponse = (data: unknown): ProductsResponse => {
  return productsResponseSchema.parse(data);
};

export const validateProductDetail = (data: unknown): ProductDetail => {
  return productDetailSchema.parse(data);
};

export const validateCategoriesResponse = (
  data: unknown
): CategoriesResponse => {
  return categoriesResponseSchema.parse(data);
};
