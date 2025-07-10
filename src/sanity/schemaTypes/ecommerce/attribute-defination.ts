import { defineType, defineField } from "sanity";

export const attributeDefinition = defineType({
  name: "attributeDefinition",
  title: "Attribute Definition",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: 'Display name (e.g., "Color", "Size", "Material")',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "code",
      title: "Code",
      type: "slug",
      description: "Unique identifier for API consistency",
      options: {
        source: "name",
        maxLength: 50,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "text",
      description: "Brief explanation of this attribute",
      rows: 2,
    }),

    defineField({
      name: "dataType",
      title: "Data Type",
      type: "string",
      options: {
        list: [
          { title: "Text", value: "text" },
          { title: "Number", value: "number" },
          { title: "Select (Dropdown)", value: "select" },
          { title: "Yes/No", value: "boolean" },
        ],
      },
      initialValue: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "allowedValues",
      title: "Allowed Values",
      type: "array",
      of: [{ type: "string" }],
      description: "Predefined options for select type",
      hidden: ({ parent }) => parent?.dataType !== "select",
    }),

    defineField({
      name: "unit",
      title: "Unit",
      type: "string",
      description: 'Unit of measurement (e.g., "cm", "kg", "inches")',
      hidden: ({ parent }) => parent?.dataType !== "number",
    }),

    defineField({
      name: "displayOrder",
      title: "Display Order",
      type: "number",
      description: "Order in forms and UI (lower numbers first)",
      initialValue: 0,
    }),
  ],

  preview: {
    select: {
      title: "name",
      subtitle: "dataType",
    },
  },

  orderings: [
    {
      title: "Display Order",
      name: "displayOrder",
      by: [
        { field: "displayOrder", direction: "asc" },
        { field: "name", direction: "asc" },
      ],
    },
  ],
});
