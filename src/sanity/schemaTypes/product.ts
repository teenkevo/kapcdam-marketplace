import { defineType, defineField } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  description:
    "Products for KAPCDAM e-commerce platform including handcrafted goods and essential items",
  fields: [
    defineField({
      name: "title",
      title: "Product Name",
      type: "string",
      description:
        'Name of the product (e.g., "Handmade Lavender Soap", "Traditional Bitengi Dress")',
      validation: (rule) =>
        rule
          .required()
          .min(3)
          .max(100)
          .error("Product name is required (3-100 characters)"),
    }),

    defineField({
      name: "slug",
      title: "URL Slug",
      type: "slug",
      description: "URL-friendly identifier for this product",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required().error("URL slug is required"),
    }),

    defineField({
      name: "description",
      title: "Product Description",
      type: "blockContent",
      description: "Full product description with rich text formatting",
      validation: (rule) =>
        rule.required().error("Product description is required"),
    }),

    defineField({
      name: "images",
      title: "Product Images",
      type: "array",
      description: "Product photos (first image will be the main image)",
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
          .max(10)
          .error("At least 1 image required (max 10)"),
    }),

    defineField({
      name: "category",
      title: "Product Category",
      type: "reference",
      description: "Select the category this product belongs to",
      to: [{ type: "product_category" }],
      validation: (rule) =>
        rule.required().error("Product category is required"),
    }),

    defineField({
      name: "hasVariants",
      title: "Has Variants",
      type: "boolean",
      description:
        "Does this product have different variants (size, color, etc.)?",
      initialValue: false,
    }),

    defineField({
      name: "variantOptions",
      title: "Variant Options",
      type: "object",
      description: "Configure what types of variants this product has",
      hidden: ({ document }) => !document?.hasVariants,
      fields: [
        defineField({
          name: "hasSizeOptions",
          title: "Has Size Options",
          type: "boolean",
          description: "Does this product come in different sizes?",
          initialValue: false,
        }),
        defineField({
          name: "sizeLabel",
          title: "Size Label",
          type: "string",
          description:
            "Custom label for size (e.g., 'Size', 'Volume', 'Weight')",
          hidden: ({ parent }) => !parent?.hasSizeOptions,
          initialValue: "Size",
        }),
        defineField({
          name: "hasColorOptions",
          title: "Has Color Options",
          type: "boolean",
          description: "Does this product come in different colors?",
          initialValue: false,
        }),
        defineField({
          name: "colorLabel",
          title: "Color Label",
          type: "string",
          description:
            "Custom label for color (e.g., 'Color', 'Scent', 'Flavor')",
          hidden: ({ parent }) => !parent?.hasColorOptions,
          initialValue: "Color",
        }),
      ],
    }),

    defineField({
      name: "price",
      title: "Price (UGX)",
      type: "number",
      description: "Product price in Ugandan Shillings",
      hidden: ({ document }) => Boolean(document?.hasVariants),
      validation: (rule) =>
        rule.custom((value, context) => {
          const hasVariants = context.document?.hasVariants;
          if (!hasVariants && (!value || value < 100)) {
            return "Price must be at least 100 UGX";
          }
          return true;
        }),
    }),

    defineField({
      name: "compareAtPrice",
      title: "Compare At Price (UGX)",
      type: "number",
      description: "Original price before discount (optional)",
      hidden: ({ document }) => Boolean(document?.hasVariants),
      validation: (rule) => rule.min(100),
    }),

    defineField({
      name: "inventory",
      title: "Stock Quantity",
      type: "number",
      description: "Number of units in stock",
      hidden: ({ document }) => Boolean(document?.hasVariants),
      validation: (rule) =>
        rule.custom((value, context) => {
          const hasVariants = context.document?.hasVariants;
          if (!hasVariants && (value === undefined || value < 0)) {
            return "Stock quantity cannot be negative";
          }
          return true;
        }),
      initialValue: 0,
    }),

    defineField({
      name: "sku",
      title: "SKU",
      type: "string",
      description: "Stock Keeping Unit identifier",
      hidden: ({ document }) => Boolean(document?.hasVariants),
    }),

    defineField({
      name: "inStock",
      title: "In Stock",
      type: "boolean",
      description: "Is this product currently available for purchase?",
      initialValue: true,
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "isActive",
      title: "Product Active",
      type: "boolean",
      description: "Is this product visible to customers?",
      initialValue: true,
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "isFeatured",
      title: "Featured Product",
      type: "boolean",
      description: "Should this product be highlighted on the homepage?",
      initialValue: false,
    }),

    defineField({
      name: "specifications",
      title: "Product Specifications",
      type: "object",
      description: "Key product details and specifications",
      fields: [
        defineField({
          name: "material",
          title: "Material",
          type: "string",
          description: "What the product is made from",
        }),
        defineField({
          name: "weight",
          title: "Weight",
          type: "string",
          description: "Product weight",
        }),
        defineField({
          name: "dimensions",
          title: "Dimensions",
          type: "string",
          description: "Product dimensions (L x W x H)",
        }),
        defineField({
          name: "careInstructions",
          title: "Care Instructions",
          type: "text",
          description: "How to care for this product",
          rows: 3,
        }),
      ],
    }),

    defineField({
      name: "tags",
      title: "Product Tags",
      type: "array",
      description:
        'Tags for search and filtering (e.g., "organic", "handmade", "gift")',
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
      description: "KAPCDAM member or staff who added this product",
      validation: (rule) =>
        rule.required().error("Created by field is required"),
    }),

    defineField({
      name: "artisan",
      title: "Artisan",
      type: "string",
      description:
        "KAPCDAM member who handcrafted this product (for handcrafted items)",
    }),
  ],

  preview: {
    select: {
      title: "title",
      price: "price",
      hasVariants: "hasVariants",
      categoryName: "category.name",
      isActive: "isActive",
      inStock: "inStock",
      inventory: "inventory",
      image: "images.0",
    },
    prepare({
      title,
      price,
      hasVariants,
      categoryName,
      isActive,
      inStock,
      inventory,
      image,
    }) {
      let priceDisplay = "";
      let variantInfo = "";
      let stockInfo = "";

      if (hasVariants) {
        priceDisplay = "See variants for pricing";
        variantInfo = " • Has variants";
      } else {
        priceDisplay = price ? `${price.toLocaleString()} UGX` : "No price";
        if (typeof inventory === "number" && inventory <= 5) {
          stockInfo = ` (Low Stock: ${inventory})`;
        }
      }

      const categoryInfo = categoryName ? ` • ${categoryName}` : "";

      let status = "";
      if (!isActive) status = " (Inactive)";
      else if (!inStock) status = " (Out of Stock)";
      else status = stockInfo;

      return {
        title: `${title}${status}`,
        subtitle: `${priceDisplay}${variantInfo}${categoryInfo}`,
        media: image,
      };
    },
  },

  orderings: [
    {
      title: "Product Name A-Z",
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
      title: "Stock Level",
      name: "stockDesc",
      by: [{ field: "inventory", direction: "desc" }],
    },
    {
      title: "Recently Added",
      name: "recentlyAdded",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
  ],
});
