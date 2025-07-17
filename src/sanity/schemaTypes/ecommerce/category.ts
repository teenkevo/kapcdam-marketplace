import { defineType, defineField } from "sanity";
import { UniqueAttributesInput } from "../../components/variant-defining-attributes-selector";

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
      name: "hasParent",
      title: "Has a parent",
      type: "boolean",
      description: "Does this category have a parent",
      initialValue: false,
    }),
    defineField({
      name: "parent",
      title: "Parent Category",
      type: "reference",
      hidden: ({ document }) => document?.hasParent == false,
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
              options: {
                filter: ({ document }) => {
                  const existingAttributeRefs = (
                    Array(document?.categoryAttributes) || []
                  )
                    //@ts-expect-error error expected
                    .map((attr) => attr?.attributeRef?._ref)
                    .filter(Boolean);

                  return {
                    filter:
                      existingAttributeRefs.length > 0
                        ? "!(_id in $existingRefs)"
                        : "",
                    params: {
                      existingRefs: existingAttributeRefs,
                    },
                  };
                },
              },
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
      components: {
        input: UniqueAttributesInput,
      },
      validation: (Rule) =>
        Rule.custom((categoryAttributes) => {
          if (!categoryAttributes || !Array.isArray(categoryAttributes)) {
            return true;
          }

          const attributeRefs = categoryAttributes
            //@ts-expect-error ref error expected
            .map((item) => item?.attributeRef?._ref)
            .filter(Boolean);

          const uniqueRefs = new Set(attributeRefs);

          if (attributeRefs.length !== uniqueRefs.size) {
            return "Each attribute can only be selected once";
          }

          return true;
        }),
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
