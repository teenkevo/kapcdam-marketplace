import { PriceInput } from "@/sanity/components/price-input";
import { defineType, defineField, defineArrayMember } from "sanity";

export const course = defineType({
  name: "course",
  title: "Course",
  type: "document",
  description: "KAPCDAM courses and training programs",
  fields: [
    defineField({
      name: "title",
      title: "Course Name",
      type: "string",
      description: "Course name",
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
      name: "startDate",
      title: "Course start date",
      type: "datetime",
      description: "When this course begins",
      validation: (rule) => rule.required().error("Course date is required"),
    }),
    defineField({
      name: "endDate",
      title: "Course end date",
      type: "datetime",
      description: "Dte when this course is expected to end",
      validation: (rule) =>
        rule
          .required()
          .error("Campaign end date is required")
          .custom((endDate, context) => {
            const startDate = context.document?.startDate as string;

            if (!startDate || !endDate) {
              return true;
            }

            if (new Date(endDate) <= new Date(startDate)) {
              return "End date must be after the start date";
            }
            return true;
          }),
    }),
    defineField({
      name: "description",
      title: "Course Description",
      type: "blockContent",
      description: "Full course description.",
      validation: (rule) =>
        rule.required().error("Course description is required"),
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
        },
      ],
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .max(8)
          .error("At least 1 image required (max 5)"),
    }),
    defineField({
      name: "previewVideo",
      title: "Preview Video",
      type: "url",
      description: "Optional YouTube or video URL for course preview",
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
        layout: "dropdown",
      },
      validation: (rule) => rule.required().error("Skill level is required"),
    }),

    defineField({
      name: "price",
      title: "Course Price (UGX)",
      type: "string",
      description: "Price of the course",
      components: {
        input: PriceInput,
      },
      validation: (rule) =>
        rule.required().min(0).error("Course should have a price"),
    }),
    defineField({
      name: "compareAtPrice",
      title: "Compare At Price (UGX)",
      type: "string",
      description: "Original price before discount (optional)",
      components: {
        input: PriceInput,
      },
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "discount",
      title: "Course Discount",
      type: "object",
      description: "Active discount campaign for this course",
      fields: [
        defineField({
          name: "value",
          title: "Discount Value",
          type: "number",
          description: "Discount percentage %",
          validation: (rule) =>
            rule

              .min(1)
              .max(100)
              .error("Discount value must be between 1% and 100%"),
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
        }),
        defineField({
          name: "endDate",
          title: "Campaign End Date",
          type: "datetime",
          description: "When this discount campaign ends",
          validation: (rule) =>
            rule
              .error("Campaign end date is required")
              .custom((endDate, context) => {
                const startDate = context.document?.startDate as string;

                if (!startDate || !endDate) {
                  return true;
                }

                if (new Date(endDate) <= new Date(startDate)) {
                  return "End date must be after the start date";
                }

                return true;
              }),
        }),

        defineField({
          name: "title",
          title: "Campaign Name",
          type: "string",
          description: "Name of the discount campaign",
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
              type: "object",
              description: "How long this module takes",
              options: {
                columns: 2,
              },
              fields: [
                defineField({
                  name: "value",
                  title: "Duration",
                  type: "number",
                  validation: (rule) =>
                    rule
                      .required()
                      .min(1)
                      .max(999)
                      .error("Duration must be between 1 and 999"),
                }),
                defineField({
                  name: "unit",
                  title: "Unit",
                  type: "string",
                  options: {
                    list: [
                      { title: "Hours", value: "hours" },
                      { title: "Minutes", value: "minutes" },
                    ],
                    layout: "dropdown",
                  },
                  validation: (rule) =>
                    rule.required().error("Duration unit is required"),
                  initialValue: "hours",
                }),
              ],
              validation: (rule) =>
                rule.required().error("Estimated duration is required"),
            }),
            defineField({
              name: "topics",
              title: "Topics Covered",
              type: "array",
              of: [{ type: "string" }],
              description: "Specific topics covered in this module",
              validation: (rule) =>
                rule.min(1).error("Estimated duration is required"),
            }),
          ],
          preview: {
            select: {
              title: "moduleTitle",
              description: "moduleDescription",
              durationValue: "estimatedDuration.value",
              durationUnit: "estimatedDuration.unit",
            },
            prepare({ title, durationValue, durationUnit }) {
              let durationText = "";

              if (durationValue && durationUnit) {
                const unit = durationUnit === "hours" ? "hrs" : "mins";
                durationText = `${durationValue} ${unit}`;
              }

              return {
                title: title || "Untitled Module",
                subtitle: durationText,
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
      type: "reference",
      to: [{ type: "team" }],
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
