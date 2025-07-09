import { defineType, defineField } from "sanity";
import { SizeInput } from "../components/size-selector";

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
      description: 'Name of the product (e.g., "Handmade Lavender Soap")',
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
      options: {
        filter: "defined(parentId)",
      },
      validation: (rule) =>
        rule.required().error("Product category is required"),
    }),
    defineField({
      name: "size",
      title: "Size",
      type: "object",
      fields: [
        defineField({
          name: "value",
          title: "Size Value",
          type: "string",
          description: "Product size (e.g., Large, 250ml, XL)",
          components: {
            input: SizeInput,
          },
        }),
        defineField({
          name: "includeInTitle",
          title: "Include in Title",
          type: "boolean",
          description: "Should size be included in the product title?",
          initialValue: true,
        }),
      ],
    }),
    defineField({
      name: "color",
      title: "Color",
      type: "object",
      fields: [
        defineField({
          name: "value",
          title: "Color Value",
          type: "string",
          description: "Product color (e.g., Lavender, Red, Natural)",
        }),
        defineField({
          name: "includeInTitle",
          title: "Include in Title",
          type: "boolean",
          description: "Should color be included in the product title?",
          initialValue: true,
        }),
      ],
    }),

    defineField({
      name: "price",
      title: "Price (UGX)",
      type: "number",
      description: "Product price in Ugandan Shillings",
      validation: (rule) =>
        rule.required().min(100).error("Price must be at least 100 UGX"),
    }),

    defineField({
      name: "compareAtPrice",
      title: "Compare At Price (UGX)",
      type: "number",
      description: "Original price before discount (optional)",
      validation: (rule) => rule.min(100),
    }),

    defineField({
      name: "inventory",
      title: "Stock Quantity",
      type: "number",
      description: "Number of units in stock",
      validation: (rule) =>
        rule.required().min(0).error("Stock quantity cannot be negative"),
      initialValue: 0,
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
      categoryName: "category.name",
      isActive: "isActive",
      inStock: "inStock",
      inventory: "inventory",
      image: "images.0",
    },
    prepare({
      title,
      price,
      categoryName,
      isActive,
      inStock,
      inventory,
      image,
    }) {
      const priceDisplay = price ? `${price.toLocaleString()} UGX` : "No price";

      let stockInfo = "";
      if (typeof inventory === "number" && inventory <= 5) {
        stockInfo = ` (Low Stock: ${inventory})`;
      }

      const categoryInfo = categoryName ? ` • ${categoryName}` : "";

      let status = "";
      if (!isActive) status = " (Inactive)";
      else if (!inStock) status = " (Out of Stock)";
      else status = stockInfo;

      return {
        title: `${title}${status}`,
        subtitle: `${priceDisplay}${categoryInfo}`,
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
