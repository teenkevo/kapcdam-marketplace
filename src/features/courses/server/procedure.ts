import { TRPCError } from "@trpc/server";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { z } from "zod";
import { dataset, projectId } from "@/sanity/env";
import { urlFor } from "@/sanity/lib/image";
import {
  getOneCourseInputSchema,
  getManyCourseInputSchema,
  courseDetailSchema,
  coursesResponseSchema,
  courseListItemSchema,
} from "../schemas";

function cleanCourseData(data: any) {
  return {
    ...data,
    isActive: data.isActive ?? true,
    isFeatured: data.isFeatured ?? false,
    price: data.price ?? "0",
    hasDiscount: data.hasDiscount ?? false,
    images: data.images === null ? null : data.images,
    defaultImage: data.defaultImage === null ? null : data.defaultImage,
    requirements: data.requirements === null ? null : Array.isArray(data.requirements) ? data.requirements : null,
    tags: data.tags === null ? null : Array.isArray(data.tags) ? data.tags : null,
    discount: data.discount === null ? null : {
      value: data.discount?.value || 0,
      isActive: data.discount?.isActive || false,
      startDate: data.discount?.startDate || "",
      endDate: data.discount?.endDate || "", 
      title: data.discount?.title || "",
      ...data.discount
    },
    discountInfo:
      data.hasDiscount && data.discountInfo ? data.discountInfo : null,
    learningOutcomes: Array.isArray(data.learningOutcomes)
      ? data.learningOutcomes
      : [],
    curriculum: Array.isArray(data.curriculum) ? data.curriculum : [],
    createdBy: data.createdBy === null ? null : data.createdBy,
  };
}

function cleanCoursesResponse(result: any) {
  return {
    items: Array.isArray(result.items) ? result.items.map(cleanCourseData) : [],
    total: result.total ?? 0,
    hasMore: result.hasMore ?? false,
    nextCursor: result.nextCursor ?? null,
  };
}

export const coursesRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(getOneCourseInputSchema)
    .query(async ({ input }) => {
      const query = groq`*[_type == "course" && slug.current == $slug && isActive == true][0]{
        _id,
        title,
        slug,
        startDate,
        endDate,
        description,
        images,
        "defaultImage": coalesce(images[0], null),
        previewVideo,
        skillLevel,
        price,
        compareAtPrice,
        discount,
        isActive,
        isFeatured,
        learningOutcomes,
        requirements,
        curriculum[] {
          moduleTitle,
          moduleDescription,
          estimatedDuration,
          topics
        },
        tags,
        createdBy-> {
          _id,
          name,
          image
        },
        "hasDiscount": defined(discount) && discount.isActive == true,
        "discountInfo": select(
          defined(discount) && discount.isActive == true => discount,
          null
        )
      }`;

      try {
        const course = await client.fetch(query, { slug: input.slug });

        if (!course) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Course not found",
          });
        }

        const cleanedCourse = cleanCourseData(course);
        console.log(cleanedCourse);
        return courseDetailSchema.parse(cleanedCourse);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("GROQ Query Error:", error);

        if (error instanceof Error && error.name === "ZodError") {
          throw new TRPCError({
            code: "PARSE_ERROR",
            message: "Invalid course data structure returned from database",
            cause: error,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch course",
        });
      }
    }),

  getMany: baseProcedure
    .input(getManyCourseInputSchema)
    .query(async ({ input }) => {
      const { search, pageSize, page, skillLevel, featured, sortBy } = input;
      const offset = (page - 1) * pageSize;

      const conditions = [`_type == "course"`, `isActive == true`];

      if (search) {
        conditions.push(
          `(title match $search + "*" || title match "*" + $search + "*")`
        );
      }

      if (skillLevel) {
        conditions.push(`skillLevel == $skillLevel`);
      }

      if (featured !== undefined) {
        conditions.push(`isFeatured == ${featured}`);
      }

      const filterExpression = conditions.join(" && ");

      // Sort order based on sortBy parameter
      let orderBy = "_createdAt desc";
      switch (sortBy) {
        case "oldest":
          orderBy = "_createdAt asc";
          break;
        case "price-asc":
          orderBy = "price asc";
          break;
        case "price-desc":
          orderBy = "price desc";
          break;
        case "name-asc":
          orderBy = "title asc";
          break;
        case "name-desc":
          orderBy = "title desc";
          break;
        case "skill-level":
          orderBy = "skillLevel asc, title asc";
          break;
        default:
          orderBy = "_createdAt desc";
      }

      const query = groq`{
        "items": *[${filterExpression}] | order(${orderBy}) [${offset}...${offset + pageSize}] {
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
          )
        },
        "total": count(*[${filterExpression}])
      }`;

      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (skillLevel) params.skillLevel = skillLevel;

      try {
        const result = await client.fetch(query, params);
        const total = result.total || 0;
        const totalPages = Math.ceil(total / pageSize);

        const cleanedResponse = cleanCoursesResponse({
          items: result.items || [],
          total,
          hasMore: page < totalPages,
          nextCursor: page < totalPages ? `page-${page + 1}` : null,
        });

        // Validate the response against our schema
        return coursesResponseSchema.parse(cleanedResponse);
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
          message: "Failed to fetch courses",
        });
      }
    }),

  // Get featured courses
  getFeatured: baseProcedure.query(async () => {
    const query = groq`*[_type == "course" && isActive == true && isFeatured == true] | order(_createdAt desc) [0...6] {
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
        )
      }`;

    try {
      const courses = await client.fetch(query);
      const cleanedCourses = (courses || []).map(cleanCourseData);

      return z.array(courseListItemSchema).parse(cleanedCourses);
    } catch (error) {
      console.error("Failed to fetch featured courses:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch featured courses",
      });
    }
  }),
});
