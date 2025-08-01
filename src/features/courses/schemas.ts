import { z } from "zod";

// Duration schema for course modules
const DurationSchema = z.object({
  value: z.number(),
  unit: z.enum(["hours", "minutes"]),
});

// Course module schema
const CourseModuleSchema = z.object({
  moduleTitle: z.string(),
  moduleDescription: z.string(),
  estimatedDuration: DurationSchema,
  topics: z.array(z.string()),
});

// Discount schema for courses
const CourseDiscountSchema = z
  .object({
    value: z.number(),
    isActive: z.boolean(),
    startDate: z.string(),
    endDate: z.string(),
    title: z.string(),
  })
  .nullable()
  .optional();

// Created by team member schema
const TeamMemberSchema = z.object({
  _id: z.string(),
  name: z.string(),
  image: z.string().nullable().optional(),
});

// Sanity image schema
const SanityImageSchema = z.object({
  _key: z.string().optional(),
  _type: z.literal("image"),
  asset: z.object({
    _ref: z.string(),
    _type: z.literal("reference"),
  }),
});

// Course detail schema (for individual course page)
export const courseDetailSchema = z.object({
  _id: z.string(),
  title: z.string(),
  slug: z.object({
    current: z.string(),
  }),
  startDate: z.string(),
  endDate: z.string(),
  description: z.any(), // Block content
  images: z.array(SanityImageSchema).nullable().optional(),
  defaultImage: SanityImageSchema.nullable().optional(),
  previewVideo: z.string().nullable().optional(),
  skillLevel: z.enum(["beginner", "intermediate", "advanced"]),
  price: z.string(),
  compareAtPrice: z.string().nullable().optional(),
  discount: z.object({
    value: z.number().optional(),
    isActive: z.boolean(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    title: z.string().optional(),
  }).nullable().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  learningOutcomes: z.array(z.string()),
  requirements: z.array(z.string()).nullable().optional(),
  curriculum: z.array(CourseModuleSchema),
  tags: z.array(z.string()).nullable().optional(),
  createdBy: TeamMemberSchema.nullable().optional(),
  hasDiscount: z.boolean().nullable().optional(),
  discountInfo: CourseDiscountSchema,
});

// Course list item schema (for course listings)
export const courseListItemSchema = z.object({
  _id: z.string(),
  title: z.string(),
  slug: z.object({
    current: z.string(),
  }),
  startDate: z.string(),
  endDate: z.string(),
  defaultImage: SanityImageSchema.nullable().optional(),
  skillLevel: z.enum(["beginner", "intermediate", "advanced"]),
  price: z.string(),
  compareAtPrice: z.string().nullable().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  hasDiscount: z.boolean().nullable().optional(),
  discountInfo: CourseDiscountSchema,
  createdBy: TeamMemberSchema.nullable().optional(),
});

// Input schemas for API endpoints
export const getOneCourseInputSchema = z.object({
  slug: z.string().min(1, "Course slug is required"),
});

export const getManyCourseInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(50).default(12),
  search: z.string().nullable().optional(),
  skillLevel: z
    .enum(["beginner", "intermediate", "advanced"])
    .nullable()
    .optional(),
  featured: z.boolean().optional(),
  sortBy: z
    .enum([
      "newest",
      "oldest",
      "price-asc",
      "price-desc",
      "name-asc",
      "name-desc",
      "skill-level",
    ])
    .default("newest"),
});

// Response schemas
export const coursesResponseSchema = z.object({
  items: z.array(courseListItemSchema),
  total: z.number(),
  hasMore: z.boolean(),
  nextCursor: z.string().nullable().optional(),
});

// Course enrollment schema
export const courseEnrollmentSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  preferredStartDate: z.string().min(1, "Preferred start date is required"),
  quantity: z.number().min(1).default(1),
});

// Export TypeScript types
export type CourseDetail = z.infer<typeof courseDetailSchema>;
export type CourseListItem = z.infer<typeof courseListItemSchema>;
export type CourseModule = z.infer<typeof CourseModuleSchema>;
export type GetOneCourseInput = z.infer<typeof getOneCourseInputSchema>;
export type GetManyCourseInput = z.infer<typeof getManyCourseInputSchema>;
export type CoursesResponse = z.infer<typeof coursesResponseSchema>;
export type CourseEnrollment = z.infer<typeof courseEnrollmentSchema>;
export type Duration = z.infer<typeof DurationSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
