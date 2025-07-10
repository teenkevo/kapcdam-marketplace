import { defineType, defineField } from "sanity";

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "parent",
      title: "Parent Category",
      type: "reference",
      to: [{ type: "category" }],
      description:
        "Leave empty for a top-level category (e.g., 'HandCrafted'). Select a parent for a sub-category (e.g., 'Clothing').",
      options: {
        filter: "!defined(parent)",
      },
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),

    defineField({
      name: "displayImage",
      title: "Display Image",
      type: "image",
      description: "Used on homepage and category listings",
      options: {
        hotspot: true,
      },
    }),

    defineField({
      name: "categoryAttributes",
      title: "Category Attributes",
      description:
        "Attributes available for products in this category. Only child categories can have attributes.",
      type: "array",
      hidden: ({ document }) => !document?.parent,
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "attributeRef",
              title: "Attribute",
              type: "reference",
              to: [{ type: "attributeDefinition" }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "allowedValuesOverride",
              title: "Override Allowed Values",
              type: "array",
              of: [{ type: "string" }],
              description:
                "IMPORTANT: Only use this for attributes with the 'Select' data type. This will override the global allowed values.",
            }),
          ],
          preview: {
            select: {
              title: "attributeRef.name",
            },
          },
        },
      ],
    }),

    defineField({
      name: "displayOrder",
      title: "Display Order",
      type: "number",
      description: "Order in navigation and UI",
      initialValue: 0,
    }),
  ],

  preview: {
    select: {
      title: "name",
      parentTitle: "parent.name",
    },
    prepare({ title, parentTitle }) {
      return {
        title,
        subtitle: parentTitle
          ? `Child of: ${parentTitle}`
          : "Top-Level Category",
      };
    },
  },

  orderings: [
    {
      title: "Display Order, Ascending",
      name: "displayOrderAsc",
      by: [
        { field: "displayOrder", direction: "asc" },
        { field: "name", direction: "asc" },
      ],
    },
  ],
});
