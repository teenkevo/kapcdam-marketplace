import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  baseProcedure,
  protectedProcedure,
} from "@/trpc/init";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import {
  getManyProductsInputSchema,
  getOneProductInputSchema,
  getRelatedProductsInputSchema,
  productDetailSchema,
  productsResponseSchema,
  categoriesResponseSchema,
  productListItemSchema,
  priceRangeSchema,
  unifiedResponseSchema,
} from "../schemas";
import { z } from "zod";
import { sanityFetch } from "@/sanity/lib/live";

const ProductRefSchema = z.object({
  _ref: z.string(),
  _type: z.string(),
  _key: z.string().optional(),
});

export type ProductRefType = z.infer<typeof ProductRefSchema>;

function cleanProductData(data: any) {
  return {
    ...data,
    hasVariants: data.hasVariants ?? false,
    status: data.status ?? "active",
    price: data.price ?? "0",
    totalStock: data.totalStock ?? 0,
    totalReviews: data.totalReviews ?? 0,
    hasDiscount: data.hasDiscount ?? false,
    variants:
      data.variants === null
        ? null
        : Array.isArray(data.variants)
          ? data.variants.map((variant: any) => ({
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
    images: data.images === null ? null : data.images,
    detailedDescription:
      data.detailedDescription === null ? null : data.detailedDescription,
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
        detailedDescription,
        images,
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
      const {
        search,
        pageSize,
        page,
        categoryId,
        minPrice,
        maxPrice,
        sortBy,
        status,
        type,
      } = input;
      const offset = (page - 1) * pageSize;

      try {
        const allItems: any[] = [];
        let totalCount = 0;

        // Fetch products if type is "all" or "products"
        if (type === "all" || type === "products") {
          const productConditions = [
            `_type == "product"`,
            `status == "${status}"`,
            `((hasVariants == false && totalStock > 0) || (hasVariants == true && math::sum(variants[].stock) > 0))`,
          ];

          if (search) {
            productConditions.push(
              `(title match $search + "*" || title match "*" + $search + "*")`
            );
          }

          if (categoryId) {
            productConditions.push(
              `(category._ref == $categoryId || category->parent._ref == $categoryId)`
            );
          }

          if (minPrice !== null && minPrice !== undefined) {
            productConditions.push(`(
              (hasVariants == true && math::min(variants[].price) >= ${minPrice}) ||
              (hasVariants == false && price >= ${minPrice})
            )`);
          }

          if (maxPrice !== null && maxPrice !== undefined) {
            productConditions.push(`(
              (hasVariants == true && math::max(variants[].price) <= ${maxPrice}) ||
              (hasVariants == false && price <= ${maxPrice})
            )`);
          }

          const productFilter = productConditions.join(" && ");

          const productQuery = groq`{
            "items": *[${productFilter}] {
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
                displayImage,
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
              ),
              "itemType": "product"
            },
            "total": count(*[${productFilter}])
          }`;

          const params: Record<string, unknown> = {};
          if (search) params.search = search;
          if (categoryId) params.categoryId = categoryId;

          const productResult = await client.fetch(productQuery, params);
          const cleanedProducts = (productResult.items || []).map(
            cleanProductData
          );

          allItems.push(...cleanedProducts);
          totalCount += productResult.total || 0;
        }

        // Fetch courses if type is "all" or "courses"
        if (type === "all" || type === "courses") {
          const courseConditions = [`_type == "course"`, `isActive == true`];

          if (search) {
            courseConditions.push(
              `(title match $search + "*" || title match "*" + $search + "*")`
            );
          }

          // Price filtering for courses (simpler structure)
          if (minPrice !== null && minPrice !== undefined) {
            courseConditions.push(`price >= ${minPrice}`);
          }

          if (maxPrice !== null && maxPrice !== undefined) {
            courseConditions.push(`price <= ${maxPrice}`);
          }

          const courseFilter = courseConditions.join(" && ");

          const courseQuery = groq`{
            "items": *[${courseFilter}] {
              _id,
              title,
              slug,
              startDate,
              endDate,
              "defaultImage": coalesce(images[0], null),
              skillLevel,
              price,
              compareAtPrice,
              isActive,
              isFeatured,
              createdBy-> {
                _id,
                name,
                image
              },
              "hasDiscount": defined(discount) && discount.isActive == true,
              "discountInfo": select(
                defined(discount) && discount.isActive == true => discount,
                null
              ),
              "itemType": "course",
              "totalStock": 1,
              "hasVariants": false,
              "variantOptions": [],
              "category": null,
              "averageRating": null,
              "totalReviews": 0,
              "status": "active"
            },
            "total": count(*[${courseFilter}])
          }`;

          const courseParams: Record<string, unknown> = {};
          if (search) courseParams.search = search;

          const courseResult = await client.fetch(courseQuery, courseParams);
          const cleanedCourses = (courseResult.items || []).map(
            (course: any) => ({
              ...course,
              isActive: course.isActive ?? true,
              isFeatured: course.isFeatured ?? false,
              price: course.price ?? "0",
              hasDiscount: course.hasDiscount ?? false,
              discountInfo:
                course.hasDiscount && course.discountInfo
                  ? course.discountInfo
                  : null,
              createdBy: course.createdBy === null ? null : course.createdBy,
            })
          );

          allItems.push(...cleanedCourses);
          totalCount += courseResult.total || 0;
        }

        // Sort the combined results
        const getSortValue = (item: any) => {
          switch (sortBy) {
            case "price-asc":
            case "price-desc":
              return parseFloat(item.price) || 0;
            case "name-asc":
            case "name-desc":
              return item.title;
            case "oldest":
            case "newest":
            default:
              return item._createdAt || new Date().toISOString();
          }
        };

        allItems.sort((a, b) => {
          const aVal = getSortValue(a);
          const bVal = getSortValue(b);

          if (
            sortBy === "price-desc" ||
            sortBy === "name-desc" ||
            sortBy === "newest"
          ) {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
          } else {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          }
        });

        // Apply pagination to the sorted results
        const paginatedItems = allItems.slice(offset, offset + pageSize);
        const hasMore = offset + pageSize < allItems.length;

        const response = {
          items: paginatedItems,
          total: totalCount,
          hasMore,
          nextCursor: hasMore ? `page-${page + 1}` : null,
        };

        // Validate the response against the unified schema
        return unifiedResponseSchema.parse(response);
      } catch (error) {
        console.error("GROQ Query Error:", error);

        if (error instanceof Error && error.name === "ZodError") {
          throw new TRPCError({
            code: "PARSE_ERROR",
            message: "Invalid data structure returned from database",
            cause: error,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch products and courses",
        });
      }
    }),

  getPriceRange: baseProcedure.query(async () => {
    const query = groq`{
      "minPrice": math::min(*[_type == "product" && status == "active" && ((hasVariants == false && totalStock > 0) || (hasVariants == true && math::sum(variants[].stock) > 0))][]{
        "price": select(
          hasVariants == true => math::min(variants[].price),
          price
        )
      }.price),
      "maxPrice": math::max(*[_type == "product" && status == "active" && ((hasVariants == false && totalStock > 0) || (hasVariants == true && math::sum(variants[].stock) > 0))][]{
        "price": select(
          hasVariants == true => math::max(variants[].price),
          price
        )
      }.price)
    }`;

    try {
      const result = await client.fetch(query);
      return priceRangeSchema.parse({
        minPrice: Math.floor(result.minPrice || 0),
        maxPrice: Math.ceil(result.maxPrice || 100000),
      });
    } catch (error) {
      console.error("Error fetching price range:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch price range",
      });
    }
  }),

  getCategories: baseProcedure.query(async () => {
    const query = groq`*[_type == "category"] | order(displayOrder asc, name asc) {
      _id,
      name,
      slug,
      hasParent,
      displayImage,
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

  /**
   * Like a product - adds product to user's likedProducts array
   */
  likeProduct: protectedProcedure
    .input(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { productId } = input;

        const user = await client.fetch(
          groq`*[_type == "user" && clerkUserId == $clerkUserId][0]`,
          { clerkUserId: ctx.auth.userId }
        );

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "User not found. Please ensure your account is properly set up.",
          });
        }

        // Verify product exists
        const product = await client.fetch(
          groq`*[_type == "product" && _id == $productId][0]{ _id }`,
          { productId }
        );

        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        const currentLikedProducts = user.likedProducts || [];
        const isAlreadyLiked = currentLikedProducts.some(
          (ref: any) => ref._ref === productId
        );

        if (isAlreadyLiked) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Product is already in your wishlist",
          });
        }

        const updatedUser = await client
          .patch(user._id)
          .setIfMissing({ likedProducts: [] })
          .append("likedProducts", [
            {
              _type: "reference",
              _ref: productId,
            },
          ])
          .commit();

        return {
          success: true,
          message: "Product liked successfully",
          likedProductsCount: updatedUser.likedProducts?.length || 0,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to like product",
        });
      }
    }),
  unlikeProduct: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { data } = await sanityFetch({
        query: `*[_type == "user" && clerkUserId == $clerkUserId][0]{
        _id,
        likedProducts
      }`,
        params: { clerkUserId: ctx.auth.userId },
      });

      if (!data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const updatedLikedProducts = (data.likedProducts || []).filter(
        (ref: any) => ref._ref !== input.productId
      );

      await client
        .patch(data._id)
        .set({ likedProducts: updatedLikedProducts })
        .commit();

      return { likedProductsCount: updatedLikedProducts.length };
    }),
  getLikedProducts: protectedProcedure.query(
    async ({ ctx }): Promise<ProductRefType[]> => {
      const { data } = await sanityFetch({
        query: `*[_type == "user" && clerkUserId == $clerkUserId][0].likedProducts`,
        params: { clerkUserId: ctx.auth.userId },
      });

      return (data || []) as ProductRefType[];
    }
  ),

  getRelatedProducts: baseProcedure
    .input(getRelatedProductsInputSchema)
    .query(async ({ input }) => {
      const { productId, categoryId, limit } = input;

      try {
        let query = "";

        const params: any = { productId, limit };

        if (categoryId) {
          // First try to get products from the same category
          query = groq`*[_type == "product" && _id != $productId && category._ref == $categoryId && status == "active" && ((hasVariants == false && totalStock > 0) || (hasVariants == true && math::sum(variants[].stock) > 0))] | order(_createdAt desc) [0...${limit}] {
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
          }`;
          params.categoryId = categoryId;
        } else {
          // If no category, get random products excluding the current one
          query = groq`*[_type == "product" && _id != $productId && status == "active" && ((hasVariants == false && totalStock > 0) || (hasVariants == true && math::sum(variants[].stock) > 0))] | order(_createdAt desc) [0...${limit}] {
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
          }`;
        }

        const products = await client.fetch(query, params);
        const cleanedProducts = (products || []).map(cleanProductData);

        // If we have less than the limit and we were filtering by category, get random products to fill up
        if (cleanedProducts.length < limit && categoryId) {
          const remainingLimit = limit - cleanedProducts.length;
          const fallbackQuery = groq`*[_type == "product" && _id != $productId && category._ref != $categoryId && status == "active" && ((hasVariants == false && totalStock > 0) || (hasVariants == true && math::sum(variants[].stock) > 0))] | order(_createdAt desc) [0...${remainingLimit}] {
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
          }`;

          const fallbackProducts = await client.fetch(fallbackQuery, {
            productId,
            categoryId,
          });
          const cleanedFallbackProducts = (fallbackProducts || []).map(
            cleanProductData
          );

          cleanedProducts.push(...cleanedFallbackProducts);
        }

        return z.array(productListItemSchema).parse(cleanedProducts);
      } catch (error) {
        console.error("Failed to fetch related products:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch related products",
        });
      }
    }),
});
