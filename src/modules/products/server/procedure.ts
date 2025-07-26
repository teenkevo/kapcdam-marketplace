import { TRPCError } from "@trpc/server";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import {
  getManyProductsInputSchema,
  getOneProductInputSchema,
  validateCategoriesResponse,
  validateProductDetail,
  validateProductsResponse,
} from "../schemas";

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
          hasVariants == true => sum(variants[].stock),
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
        }
      }`;

      const product = await client.fetch(query, { slug: input.slug });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return validateProductDetail(product);
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
          "compareAtPrice": select(
            hasVariants == true => variants[isDefault == true][0].compareAtPrice,
            compareAtPrice
          ),
          "totalStock": select(
            hasVariants == true => sum(variants[].stock),
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
          "discountInfo": discount {
            value,
            isActive,
            title,
            startDate,
            endDate
          }
        },
        "total": count(*[${filterExpression}])
      }`;

      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (categoryId) params.categoryId = categoryId;
      if (lastId) params.lastId = lastId;

      try {
        const result = await client.fetch(query, params);

        return validateProductsResponse({
          items: result.items || [],
          total: result.total || 0,
          hasMore: (result.items?.length || 0) === pageSize,
          nextCursor:
            result.items && result.items.length > 0
              ? result.items[result.items.length - 1]._id
              : null,
        });
      } catch (error) {
        console.error("GROQ Query Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch products",
        });
      }
    }),

  // Helper procedure to get categories for filtering
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
      return validateCategoriesResponse(categories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch categories",
      });
    }
  }),
});
