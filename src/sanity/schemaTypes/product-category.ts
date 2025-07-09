import { defineType, defineField } from "sanity";

export const category = defineType({
  name: "product_category",
  title: "Product Category",
  type: "document",
  description: "Product categories for KAPCDAM e-commerce.",
  fields: [
    defineField({
      name: "name",
      title: "Category Name",
      type: "string",
      description:
        'Name of the category (e.g., "Handcrafted", "Clothing", "Personal Care")',
      validation: (rule) =>
        rule
          .required()
          .min(2)
          .max(50)
          .error("Category name is required (2-50 characters)"),
    }),

    defineField({
      name: "slug",
      title: "URL Slug",
      type: "slug",
      description: "URL-friendly identifier for this category",
      options: {
        source: "name",
        maxLength: 50,
      },
      validation: (rule) => rule.required().error("URL slug is required"),
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "text",
      description: "Optional description of this category",
      rows: 3,
    }),

    defineField({
      name: "parentId",
      title: "Parent Category",
      type: "reference",
      description:
        'Parent category (leave empty for top-level categories like "Handcrafted" or "Essential")',
      to: [{ type: "product_category" }],
      options: {
        filter: ({ document }) => {
          return {
            filter: "_id != $id",
            params: { id: document._id },
          };
        },
      },
    }),

    defineField({
      name: "sizeMapType",
      title: "Product Size Options",
      type: "string",
      description:
        'What size options should products in this category have? Choose "None" if products don\'t need sizes.',
      hidden: ({ document }) => !document?.parentId,
      options: {
        list: [
          {
            title: "None (No sizes needed)",
            value: "none",
          },
          {
            title: "Clothing Sizes (XS, S, M, L, XL, XXL)",
            value: "clothing_sizes",
          },
          {
            title: "General Sizes (Small, Medium, Large)",
            value: "general_sizes",
          },
          {
            title: "Liquid Volumes (10ml - 10L)",
            value: "liquid_volumes",
          },
          {
            title: "Solid Weights (10g - 2kg)",
            value: "solid_weights",
          },
        ],
        layout: "dropdown",
      },
      initialValue: "none",
    }),

    defineField({
      name: "isActive",
      title: "Active",
      type: "boolean",
      description: "Is this category active and visible to customers?",
      initialValue: true,
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      description:
        "Order for displaying categories (lower numbers appear first)",
      initialValue: 0,
    }),
  ],

  preview: {
    select: {
      name: "name",
      parentName: "parentId.name",
      sizeMapType: "sizeMapType",
      isActive: "isActive",
      icon: "icon",
    },
    prepare({ name, parentName, sizeMapType, isActive }) {
      const hierarchy = parentName ? `${parentName} → ${name}` : name;

      let sizeInfo = "";
      if (!parentName) {
        sizeInfo = " • Parent category";
      } else if (!sizeMapType) {
        sizeInfo = " • No size options selected";
      } else if (sizeMapType === "none") {
        sizeInfo = " • No sizes needed";
      } else {
        sizeInfo = ` • ${sizeMapType.replace("_", " ")}`;
      }

      const statusIcon = isActive ? "" : " (Inactive)";

      return {
        title: `${hierarchy}${statusIcon}`,
        subtitle: `${sizeInfo}`,
      };
    },
  },

  orderings: [
    {
      title: "Sort Order",
      name: "sortOrder",
      by: [
        { field: "sortOrder", direction: "asc" },
        { field: "name", direction: "asc" },
      ],
    },
    {
      title: "Name A-Z",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
    {
      title: "Parent Category",
      name: "byParent",
      by: [
        { field: "parentId.name", direction: "asc" },
        { field: "sortOrder", direction: "asc" },
      ],
    },
  ],
});

// Helper function to get size options based on size type (for child categories only)
export const getSizeOptions = (sizeMapType: string): string[] => {
  const sizeMapTypes = {
    clothing_sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    general_sizes: ["Small", "Medium", "Large"],
    liquid_volumes: [
      "10ml",
      "50ml",
      "100ml",
      "250ml",
      "500ml",
      "1L",
      "2L",
      "5L",
      "10L",
    ],
    solid_weights: ["10g", "50g", "100g", "200g", "500g", "1kg", "2kg"],
    none: [],
  };

  return sizeMapTypes[sizeMapType as keyof typeof sizeMapTypes] || [];
};
