import { defineType, defineField } from "sanity";
import { AttributeValueInput } from "@/sanity/components/attribute-value-input";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "attributes", title: "Attributes" },
    { name: "inventory", title: "Inventory & Pricing" },
    { name: "media", title: "Media" },
  ],
  fields: [
    // Details Group
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "details",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "details",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      group: "details",
      to: [{ type: "category" }],
      description: "Select a child category for this product.",
      options: {
        filter: "defined(parent)",
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "highlights",
      title: "Highlights",
      type: "array",
      group: "details",
      of: [{ type: "string" }],
      description: "Key product features or selling points.",
    }),

    defineField({
      name: "detailedDescription",
      title: "Detailed Description",
      type: "blockContent",
      group: "details",
      description: "Rich text product description.",
    }),

    defineField({
      name: "hasVariants",
      title: "Has Variants",
      type: "boolean",
      group: "details",
      description:
        "Enable this if the product comes in different versions like size or color.",
      initialValue: false,
    }),

    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "details",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Active", value: "active" },
          { title: "Archived", value: "archived" },
        ],
      },
      initialValue: "draft",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "variantDefiningAttributes",
      title: "Variant-Defining Attributes",
      group: "attributes",
      type: "array",
      description:
        "Select attributes that create variants (e.g., Color, Size).",
      hidden: ({ document }) => !document?.hasVariants,
      of: [
        {
          type: "reference",
          to: [{ type: "attributeDefinition" }],
          options: {
            filter: ({ document }) => {
              // @ts-expect-error sanity doesn't provide the correct type for document
              const categoryId = document.category?._ref;
              if (!categoryId) {
                return { filter: "false" };
              }

              return {
                filter: `_id in *[_type=="category" && _id==$categoryId][0].categoryAttributes[].attributeRef._ref`,
                params: { categoryId },
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.max(3),
    }),

    defineField({
      name: "specifications",
      title: "Specifications",
      group: "attributes",
      type: "array",
      description:
        "Attributes that describe the product but do not create variants (e.g., Material, Weight).",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "attributeRef",
              title: "Attribute",
              type: "reference",
              to: [{ type: "attributeDefinition" }],
              options: {
                filter: ({ document }) => {
                  // @ts-expect-error sanity doesn't provide the correct type for document
                  const categoryId = document.category?._ref;
                  const variantAttrIds = (
                    (document.variantDefiningAttributes as {
                      _ref: string;
                    }[]) || []
                  )
                    .map((ref) => ref._ref)
                    .filter(Boolean);

                  if (!categoryId) {
                    return { filter: "false" };
                  }

                  // Filter for attributes in the category that are NOT already used for variants
                  return {
                    filter: `_id in *[_type=="category" && _id==$categoryId][0].categoryAttributes[].attributeRef._ref && !(_id in $variantAttrIds)`,
                    params: { categoryId, variantAttrIds },
                  };
                },
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "value",
              title: "Value",
              type: "string",
              components: {
                input: AttributeValueInput,
              },
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: "attributeRef.name",
              subtitle: "value",
            },
          },
        },
      ],
    }),

    defineField({
      name: "price",
      title: "Price",
      type: "string",
      group: "inventory",
      description: "The price for the product if it has no variants.",
      hidden: ({ document }) => document?.hasVariants === true,
      validation: (Rule) =>
        Rule.custom((price) => {
          if (typeof price === "undefined") {
            return true;
          }
          // Regex to check for a valid positive number
          if (!/^\d*\.?\d*$/.test(price)) {
            return "Price must be a valid number.";
          }
          if (parseInt(price) < 0) {
            return "Price cannot be negative.";
          }
          return true;
        }),
    }),

    defineField({
      name: "totalStock",
      title: "Stock Quantity",
      type: "number",
      group: "inventory",
      description: "Total available stock for this product.",
      hidden: ({ document }) => document?.hasVariants === true,
      validation: (Rule) => Rule.min(0).integer(),
    }),

    // Media Group
    defineField({
      name: "images",
      title: "Product Images",
      type: "array",
      group: "media",
      of: [
        {
          type: "image",
          options: {
            hotspot: true,
          },
          fields: [
            defineField({
              name: "alt",
              title: "Alt Text",
              type: "string",
              description: "Important for accessibility and SEO.",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "isDefualt",
              title: "Is default image?",
              type: "boolean",
              description: "Check if this is the default image",
              validation: (Rule) => Rule.required(),
            }),
          ],
        },
      ],
      validation: (Rule) =>
        Rule.custom((images) => {
          if (!images) {
            return true;
          }
          const defaultImages = (images as { isDefault?: boolean }[]).filter(
            (img) => img.isDefault === true
          );
          if (defaultImages.length > 1) {
            return "You can only set one image as the default.";
          }
          return true;
        }),
    }),
  ],

  preview: {
    select: {
      title: "title",
      categoryName: "category.name",
      media: "images.0",
      status: "status",
    },
    prepare({ title, categoryName, media, status }) {
      return {
        title,
        subtitle: `${categoryName || "No category"} – ${status}`,
        media,
      };
    },
  },
});
