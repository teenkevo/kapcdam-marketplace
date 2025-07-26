import { TRPCError } from "@trpc/server";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import {
  getManyProductsInputSchema,
  getOneProductInputSchema,
  productDetailSchema,
  productsResponseSchema,
  categoriesResponseSchema,
} from "../schemas";

function cleanProductData(data: any) {
  return {
    ...data,
    hasVariants: data.hasVariants ?? false,
    status: data.status ?? "active",
    price: data.price ?? "0",
    totalStock: data.totalStock ?? 0,
    totalReviews: data.totalReviews ?? 0,
    hasDiscount: data.hasDiscount ?? false,
    variantOptions: Array.isArray(data.variantOptions)
      ? data.variantOptions.map((variant: any) => ({
          ...variant,
          sku: variant.sku ?? "",
          price: variant.price ?? "0",
          stock: variant.stock ?? 0,
          isDefault: variant.isDefault ?? false,
          attributes: Array.isArray(variant.attributes)
            ? variant.attributes
            : [],
        }))
      : [],
    category: {
      ...data.category,
      hasParent: data.category?.hasParent ?? false,
    },
    discountInfo:
      data.hasDiscount && data.discountInfo ? data.discountInfo : null,
  };
}

function cleanProductsResponse(result: any) {
  return {
    items: Array.isArray(result.items)
      ? result.items.map(cleanProductData)
      : [],
    total: result.total ?? 0,
    hasMore: result.hasMore ?? false,
    nextCursor: result.nextCursor ?? null,
  };
}

export const productsRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(getOneProductInputSchema)
    .query(async ({ input }) => {
      const query = groq`*[_type == "product" && slug.current == $slug][0]{
        _id,
        title,
        slug,
        hasVariants,
        status,
        "defaultImage": coalesce(images[isDefault == true][0], images[0]),
        "price": select(
          hasVariants == true => variants[isDefault == true][0].price,
          price
        ),
        "totalStock": select(
          hasVariants == true => math::sum(variants[].stock),
          totalStock
        ),
        "averageRating": math::avg(*[_type == "reviews" && product._ref == ^._id && status == "approved"].rating),
        "totalReviews": count(*[_type == "reviews" && product._ref == ^._id && status == "approved"]),
        category-> {
          _id,
          name,
          slug,
          hasParent,
          parent-> {
            _id,
            name,
            slug
          }
        },
        variants[] {
          sku,
          price,
          stock,
          isDefault,
          attributes[] {
            "attributeName": attributeRef->name,
            "attributeCode": attributeRef->code.current,
            value
          }
        },
        "variantOptions": variants[] {
          sku,
          price,
          stock,
          isDefault,
          attributes[] {
            "attributeName": attributeRef->name,
            "attributeCode": attributeRef->code.current,
            value
          }
        },
        "hasDiscount": defined(discount) && discount.isActive == true,
        "discountInfo": select(
          defined(discount) && discount.isActive == true => discount,
          null
        )
      }`;

      try {
        const product = await client.fetch(query, { slug: input.slug });

        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        const cleanedProduct = cleanProductData(product);
        return productDetailSchema.parse(cleanedProduct);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("GROQ Query Error:", error);

        if (error instanceof Error && error.name === "ZodError") {
          throw new TRPCError({
            code: "PARSE_ERROR",
            message: "Invalid product data structure returned from database",
            cause: error,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch product",
        });
      }
    }),

  getMany: baseProcedure
    .input(getManyProductsInputSchema)
    .query(async ({ input }) => {
      const { search, pageSize, lastId, categoryId, status } = input;

      const conditions = [`_type == "product"`, `status == "${status}"`];

      if (search) {
        conditions.push(`(title match $search + "*")`);
      }

      if (categoryId) {
        conditions.push(`category._ref == $categoryId`);
      }

      if (lastId) {
        conditions.push(`_id > $lastId`);
      }

      const filterExpression = conditions.join(" && ");

      const query = groq`{
        "items": *[${filterExpression}] | order(_id asc) [0...${pageSize}] {
          _id,
          title,
          slug,
          hasVariants,
          status,
          "defaultImage": coalesce(images[isDefault == true][0], images[0]),
          "price": select(
            hasVariants == true => variants[isDefault == true][0].price,
            price
          ),
          "totalStock": select(
            hasVariants == true => math::sum(variants[].stock),
            totalStock
          ),
          "averageRating": math::avg(*[_type == "reviews" && product._ref == ^._id && status == "approved"].rating),
          "totalReviews": count(*[_type == "reviews" && product._ref == ^._id && status == "approved"]),
          category-> {
            _id,
            name,
            slug,
            hasParent,
            parent-> {
              _id,
              name,
              slug
            }
          },
          "variantOptions": variants[] {
            sku,
            price,
            stock,
            isDefault,
            attributes[] {
              "attributeName": attributeRef->name,
              "attributeCode": attributeRef->code.current,
              value
            }
          },
          "hasDiscount": defined(discount) && discount.isActive == true,
          "discountInfo": select(
            defined(discount) && discount.isActive == true => discount,
            null
          )
        },
        "total": count(*[${filterExpression}])
      }`;

      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (categoryId) params.categoryId = categoryId;
      if (lastId) params.lastId = lastId;

      try {
        const result = await client.fetch(query, params);

        const cleanedResponse = cleanProductsResponse({
          items: result.items || [],
          total: result.total || 0,
          hasMore: (result.items?.length || 0) === pageSize,
          nextCursor:
            result.items && result.items.length > 0
              ? result.items[result.items.length - 1]._id
              : null,
        });

        // Validate the response against our schema
        return productsResponseSchema.parse(cleanedResponse);
      } catch (error) {
        console.error("GROQ Query Error:", error);

        // Check if it's a Zod validation error
        if (error instanceof Error && error.name === "ZodError") {
          throw new TRPCError({
            code: "PARSE_ERROR",
            message: "Invalid data structure returned from database",
            cause: error,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch products",
        });
      }
    }),

  getCategories: baseProcedure.query(async () => {
    const query = groq`*[_type == "category"] | order(displayOrder asc, name asc) {
      _id,
      name,
      slug,
      hasParent,
      parent-> {
        _id,
        name,
        slug
      }
    }`;

    try {
      const categories = await client.fetch(query);

      return categoriesResponseSchema.parse(categories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);

      if (error instanceof Error && error.name === "ZodError") {
        throw new TRPCError({
          code: "PARSE_ERROR",
          message: "Invalid category data structure returned from database",
          cause: error,
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch categories",
      });
    }
  }),
});
