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
      name: "allowedValues",
      title: "Allowed Values",
      type: "array",
      of: [{ type: "string" }],
      description: "Predefined options for this attribute",
      validation: (Rule) => Rule.required().min(1),
    }),
  ],

  preview: {
    select: {
      title: "name",
      subtitle: "code.current",
    },
  },

  orderings: [
    {
      title: "Name",
      name: "name",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
});
