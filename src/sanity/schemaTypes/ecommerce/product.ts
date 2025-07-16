import { defineType, defineField } from "sanity";
import { ProductFormComponent } from "@/sanity/components/product-form-component";
import { PriceInput } from "@/sanity/components/price-input";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  components: {
    input: ProductFormComponent,
  },

  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      description: "Select a child category for this product.",
      options: {
        filter: "defined(parent)",
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "detailedDescription",
      title: "Detailed Description",
      type: "blockContent",
      description: "Rich text product description.",
    }),

    defineField({
      name: "hasVariants",
      title: "Has Variants",
      type: "boolean",
      description:
        "Enable this if the product comes in different versions like size or color.",
      initialValue: false,
    }),

    defineField({
      name: "variants",
      title: "Product Variants",
      type: "array",
      description: "Define different variations of this product.",
      hidden: ({ document }) => !document?.hasVariants,
      of: [{ type: "productVariant" }],
      validation: (Rule) =>
        Rule.custom((variants) => {
          if (!variants || !Array.isArray(variants)) return true;

          const defaultVariants = variants.filter(
            // @ts-expect-error sanity error expected
            (variant) => variant?.isDefault === true
          );

          if (defaultVariants.length > 1) {
            return "You can only set one variant as the default.";
          }

          return true;
        }),
    }),

    defineField({
      name: "price",
      title: "Price",
      type: "string",
      components: {
        input: PriceInput,
      },
      description: "The price for the product if it has no variants.",
      hidden: ({ document }) => document?.hasVariants === true,
      validation: (Rule) =>
        Rule.custom((price) => {
          if (typeof price === "undefined") {
            return true;
          }
          if (!/^\d*\.?\d*$/.test(price)) {
            return "Price must be a valid number.";
          }
          if (parseFloat(price) < 0) {
            return "Price cannot be negative.";
          }
          return true;
        }),
    }),

    defineField({
      name: "totalStock",
      title: "Stock Quantity",
      type: "number",
      description: "Total available stock for this product.",
      hidden: ({ document }) => document?.hasVariants === true,
      validation: (Rule) => Rule.min(0).integer(),
    }),

    defineField({
      name: "images",
      title: "Product Images",
      type: "array",
      of: [
        {
          type: "image",
          options: {
            hotspot: true,
          },
          fields: [
            defineField({
              name: "isDefault",
              title: "Is default image?",
              type: "boolean",
              description: "Check if this is the default image",
            }),
          ],
          preview: {
            select: {
              asset: "asset",
              isDefault: "isDefault",
              filename: "asset.originalFilename",
            },
            prepare(selection) {
              const { isDefault, asset, filename } = selection;
              return {
                title: filename,
                subtitle: isDefault ? "Default Image" : "",
                media: asset,
              };
            },
          },
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

    defineField({
      name: "status",
      title: "Product Status",
      description: "Is this product availble for purchase",
      type: "string",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Active", value: "active" },
          { title: "Archived", value: "archived" },
        ],
      },
      initialValue: "active",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "discount",
      title: "Product Discount",
      hidden: ({ document }) => document?.hasVariants === true,
      type: "object",
      description: "Active discount campaign for this product",
      fields: [
        defineField({
          name: "value",
          title: "Discount percentage (%)",
          type: "number",
          description: "Input a value between 1 - 100",
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
          validation: (rule) =>
            rule.custom((startDate, context) => {
              const parent = context.parent as {
                value?: number;
                isActive?: boolean;
              };
              if (
                parent.value !== undefined &&
                parent.isActive === true &&
                !startDate
              ) {
                return "Start date is required when a discount value is set and active.";
              }
              return true;
            }),
        }),

        defineField({
          name: "endDate",
          title: "Campaign End Date",
          type: "datetime",
          description: "When this discount campaign ends",
          validation: (rule) =>
            rule.custom((endDate, context) => {
              const parent = context.parent as {
                value?: number;
                isActive?: boolean;
                startDate?: string;
              };
              const startDate = parent.startDate;

              if (
                parent.value !== undefined &&
                parent.isActive === true &&
                !endDate
              ) {
                return "End date is required when a discount value is set and active.";
              }

              if (startDate && endDate) {
                if (new Date(endDate) <= new Date(startDate)) {
                  return "End date must be after the start date";
                }
              }
              return true;
            }),
        }),

        defineField({
          name: "title",
          title: "Campaign Name",
          type: "string",
          description: "Name of the discount campaign",
          validation: (rule) =>
            rule.custom((title, context) => {
              const parent = context.parent as {
                value?: number;
                isActive?: boolean;
              };
              if (
                parent.value !== undefined &&
                parent.isActive === true &&
                !title
              ) {
                return "Campaign name is required when a discount value is set and active.";
              }
              return true;
            }),
        }),
      ],
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
