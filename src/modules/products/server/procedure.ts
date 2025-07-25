import { TRPCError } from "@trpc/server";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { z } from "zod";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { EnhancedProductSchema, ProductsResponseSchema, SingleProductSchema } from "../schemas";

export const productsRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const query = groq`*[_type == "product" && slug.current == $slug][0]{
        ...,
        "defaultImage": coalesce(images[isDefault == true][0], images[0]),
        "defaultVariant": variants[isDefault == true][0],
        "totalStock": select(
          hasVariants == true => math::sum(variants[].totalStock),
          totalStock
        ),
        "price": select(
          hasVariants == true => variants[isDefault == true][0].price,
          price
        ),
        "rating": coalesce(rating, 0),
        "totalReviews": count(*[_type == "review" && product._ref == ^._id]),
        category->{
          _id,
          _type,
          name,
          slug,
          description
        }
      }`;
      
      const product = await client.fetch(query, {
        slug: input.slug,
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }
      
      return SingleProductSchema.parse(product);
    }),

  getMany: baseProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().min(1).max(10).default(10),
        search: z.string().nullish(),
        lastId: z.string().nullish(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, pageSize, lastId } = input;

      const searchCondition = search
        ? `&& (title match $search + "*" || description match $search + "*")`
        : "";

      const cursorCondition = lastId ? `&& _id > $lastId` : "";
      const query = groq`{
      "items": *[_type == "product" ${searchCondition} ${cursorCondition}] | order(_id asc) [0...${pageSize}]{
        ...,
        "defaultImage": coalesce(images[isDefault == true][0], images[0]),
        "defaultVariant": variants[isDefault == true][0],
        "totalStock": select(
          hasVariants == true => math::sum(variants[].totalStock),
          totalStock
        ),
        "price": select(
          hasVariants == true => variants[isDefault == true][0].price,
          price
        ),
        "rating": coalesce(rating, 0),
        "totalReviews": count(*[_type == "review" && product._ref == ^._id]),
        category->{
          _id,
          _type,
          name,
          slug,
          description
        }
      },
      "total": count(*[_type == "product" ${searchCondition}])
    }`;

      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (lastId) params.lastId = lastId;

      console.log(query);

      const result = await client.fetch(query, params);
      console.log("Query Result: ", result);
      
      const parsedResult = ProductsResponseSchema.parse({
        items: result.items,
        total: result.total,
        hasMore: result.items.length === pageSize,
        nextCursor: result.items.length > 0 ? result.items[result.items.length - 1]._id : null,
      });

      return parsedResult;
    }),
});
