import { TRPCError } from "@trpc/server";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";

import { z } from "zod";
import { client } from "@/sanity/lib/client";
import { Product } from "@root/sanity.types";
import { groq } from "next-sanity";

export const productsRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const query = groq`*[_type == "product" && slug.current == $slug][0]`;
      const product = client.fetch(query, {
        slug: input.slug,
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }
      return product;
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
      "items": *[_type == "product" ${searchCondition} ${cursorCondition}] | order(_id asc) [0...${pageSize}],
      "total": count(*[_type == "product" ${searchCondition}])
    }`;

      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (lastId) params.lastId = lastId;

      const result = await client.fetch(query, params);
      const items = z.custom<Product[]>().parse(result.items);
      const total = z.number().parse(result.total);
      const nextCursor = z
        .string()
        .nullable()
        .parse(
          result.items.length > 0
            ? result.items[result.items.length - 1]._id
            : null
        );

      return {
        items,
        total,
        hasMore: result.items.length === pageSize,
        nextCursor,
      };
    }),
});
