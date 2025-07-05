import { defineType, defineField, defineArrayMember } from "sanity";

export const course = defineType({
  name: "course",
  title: "Course",
  type: "document",
  description:
    "KAPCDAM courses including dressmaking, soap making, candle making, and other in-person training programs",
  fields: [
    defineField({
      name: "title",
      title: "Course Name",
      type: "string",
      description:
        'Course name (e.g., "Dressmaking Basics", "Soap Making for Beginners")',
      validation: (rule) =>
        rule
          .required()
          .min(5)
          .max(100)
          .error("Course name is required (5-100 characters)"),
    }),
    defineField({
      name: "slug",
      title: "URL Slug",
      type: "slug",
      description: "URL-friendly identifier for this course",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required().error("URL slug is required"),
    }),
    defineField({
      name: "description",
      title: "Course Description",
      type: "blockContent",
      description: "Full course description with rich text formatting",
      validation: (rule) =>
        rule.required().error("Course description is required"),
    }),

    defineField({
      name: "shortDescription",
      title: "Short Description",
      type: "text",
      description: "Brief summary for course cards and listings",
      rows: 3,
      validation: (rule) =>
        rule
          .required()
          .min(10)
          .max(200)
          .error("Short description is required (10-200 characters)"),
    }),

    defineField({
      name: "images",
      title: "Course Images",
      type: "array",
      description:
        "Course photos and illustrations (first image will be the main image)",
      of: [
        {
          type: "image",
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: "alt",
              type: "string",
              title: "Alternative Text",
              description: "Describe this image for accessibility",
            },
          ],
        },
      ],
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .max(8)
          .error("At least 1 image required (max 8)"),
    }),
    defineField({
      name: "previewVideo",
      title: "Preview Video",
      type: "url",
      description: "Optional YouTube or video URL for course preview",
    }),
    defineField({
      name: "duration",
      title: "Course Duration",
      type: "string",
      description: 'Course length (e.g., "30 days", "2 weeks", "3 months")',
      validation: (rule) =>
        rule.required().error("Course duration is required"),
    }),
    defineField({
      name: "totalHours",
      title: "Total Hours",
      type: "string",
      description: 'Estimated total hours (e.g., "40 hours", "60 hours")',
      validation: (rule) => rule.required().error("Total hours is required"),
    }),
    defineField({
      name: "skillLevel",
      title: "Skill Level",
      type: "string",
      description: "Course difficulty level",
      options: {
        list: [
          { title: "Beginner", value: "beginner" },
          { title: "Intermediate", value: "intermediate" },
          { title: "Advanced", value: "advanced" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required().error("Skill level is required"),
    }),

    defineField({
      name: "price",
      title: "Course Price (UGX)",
      type: "number",
      description: "Course price in Ugandan Shillings",
      validation: (rule) =>
        rule
          .required()
          .min(10000)
          .error("Course price must be at least 10,000 UGX"),
    }),
    defineField({
      name: "compareAtPrice",
      title: "Compare At Price (UGX)",
      type: "number",
      description: "Original price before discount (optional)",
      validation: (rule) => rule.min(10000),
    }),
    defineField({
      name: "discount",
      title: "Course Discount",
      type: "object",
      description: "Active discount campaign for this course",
      fields: [
        defineField({
          name: "type",
          title: "Discount Type",
          type: "string",
          options: {
            list: [
              { title: "Percentage", value: "percentage" },
              { title: "Fixed Amount", value: "fixed_amount" },
            ],
            layout: "radio",
          },
          validation: (rule) =>
            rule.required().error("Discount type is required"),
        }),
        defineField({
          name: "value",
          title: "Discount Value",
          type: "number",
          description: "Discount amount (percentage or UGX amount)",
          validation: (rule) =>
            rule.required().min(1).error("Discount value must be at least 1"),
        }),
        defineField({
          name: "isActive",
          title: "Discount Active",
          type: "boolean",
          description: "Is this discount currently active?",
          initialValue: false,
        }),
        defineField({
          name: "startDate",
          title: "Campaign Start Date",
          type: "datetime",
          description: "When this discount campaign begins",
          validation: (rule) =>
            rule.required().error("Campaign start date is required"),
        }),
        defineField({
          name: "endDate",
          title: "Campaign End Date",
          type: "datetime",
          description: "When this discount campaign ends",
          validation: (rule) =>
            rule.required().error("Campaign end date is required"),
        }),
        defineField({
          name: "title",
          title: "Campaign Name",
          type: "string",
          description: "Name of the discount campaign",
          validation: (rule) =>
            rule.required().error("Campaign name is required"),
        }),
      ],
    }),
    defineField({
      name: "isActive",
      title: "Course Active",
      type: "boolean",
      description: "Is this course published and available for booking?",
      initialValue: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "isFeatured",
      title: "Featured Course",
      type: "boolean",
      description: "Should this course be highlighted on the homepage?",
      initialValue: false,
    }),
    defineField({
      name: "learningOutcomes",
      title: "Learning Outcomes",
      type: "array",
      description: "Skills and knowledge students will gain from this course",
      of: [{ type: "string" }],
      validation: (rule) =>
        rule
          .required()
          .min(3)
          .max(10)
          .error("At least 3 learning outcomes required (max 10)"),
    }),
    defineField({
      name: "requirements",
      title: "Course Requirements",
      type: "array",
      description: "Prerequisites, materials needed, or preparation required",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "curriculum",
      title: "Course Curriculum",
      type: "array",
      description: "Course outline and syllabus",
      of: [
        defineArrayMember({
          type: "object",
          title: "Course Module",
          fields: [
            defineField({
              name: "moduleTitle",
              title: "Module Title",
              type: "string",
              validation: (rule) =>
                rule.required().error("Module title is required"),
            }),
            defineField({
              name: "moduleDescription",
              title: "Module Description",
              type: "text",
              rows: 2,
              validation: (rule) =>
                rule.required().error("Module description is required"),
            }),
            defineField({
              name: "estimatedDuration",
              title: "Estimated Duration",
              type: "string",
              description:
                'How long this module takes (e.g., "3 hours", "2 days")',
              validation: (rule) =>
                rule.required().error("Estimated duration is required"),
            }),
            defineField({
              name: "topics",
              title: "Topics Covered",
              type: "array",
              of: [{ type: "string" }],
              description: "Specific topics covered in this module",
            }),
          ],
          preview: {
            select: {
              title: "moduleTitle",
              description: "moduleDescription",
              duration: "estimatedDuration",
            },
            prepare({ title, duration }) {
              return {
                title: title || "Untitled Module",
                subtitle: `${duration || "Duration TBD"}`,
              };
            },
          },
        }),
      ],
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .max(20)
          .error("At least 1 module required (max 20)"),
    }),

    defineField({
      name: "tags",
      title: "Course Tags",
      type: "array",
      description:
        'Tags for search and filtering (e.g., "handcraft", "business", "creative")',
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    }),

    defineField({
      name: "createdBy",
      title: "Created By",
      type: "string",
      description: "KAPCDAM staff member who created this course",
      validation: (rule) =>
        rule.required().error("Created by field is required"),
    }),

    defineField({
      name: "notes",
      title: "Internal Notes",
      type: "text",
      description: "Internal admin notes about this course",
      rows: 3,
    }),
  ],

  preview: {
    select: {
      title: "title",
      price: "price",
      isActive: "isActive",
      isFeatured: "isFeatured",
      image: "images.0",
      discountIsActive: "discount.isActive",
      discountType: "discount.type",
      discountValue: "discount.value",
    },
    prepare({
      title,
      price,
      isActive,
      isFeatured,
      image,
      discountIsActive,
      discountType,
      discountValue,
    }) {
      const priceFormatted = price
        ? `${price.toLocaleString()} UGX`
        : "No price";

      let discountInfo = "";
      if (discountIsActive && discountType && discountValue) {
        const discountDisplay =
          discountType === "percentage"
            ? `${discountValue}% OFF`
            : `${discountValue.toLocaleString()} UGX OFF`;
        discountInfo = ` • ${discountDisplay}`;
      }

      const statusInfo = !isActive
        ? " (Inactive)"
        : isFeatured
          ? " (Featured)"
          : "";

      return {
        title: `${title}${statusInfo}`,
        subtitle: `${priceFormatted}${discountInfo}`,
        media: image,
      };
    },
  },

  orderings: [
    {
      title: "Course Name A-Z",
      name: "nameAsc",
      by: [{ field: "title", direction: "asc" }],
    },
    {
      title: "Price: Low to High",
      name: "priceAsc",
      by: [{ field: "price", direction: "asc" }],
    },
    {
      title: "Price: High to Low",
      name: "priceDesc",
      by: [{ field: "price", direction: "desc" }],
    },
    {
      title: "Skill Level",
      name: "skillLevel",
      by: [{ field: "skillLevel", direction: "asc" }],
    },
    {
      title: "Recently Added",
      name: "recentlyAdded",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
    {
      title: "Featured First",
      name: "featuredFirst",
      by: [
        { field: "isFeatured", direction: "desc" },
        { field: "title", direction: "asc" },
      ],
    },
  ],
});
