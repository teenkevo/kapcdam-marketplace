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
      options: {
        filter: () => {
          return {
            filter: "defined(parentId)",
            params: {},
          };
        },
      },
      validation: (rule) =>
        rule.required().error("Product category is required"),
    }),

    defineField({
      name: "hasSizeOptions",
      title: "Different Sizes, Different Prices",
      type: "boolean",
      description:
        "Does this product come in different sizes with different prices?",
      initialValue: false,
    }),

    defineField({
      name: "hasColorOptions",
      title: "Different Colors, Different Prices",
      type: "boolean",
      description:
        "Does this product come in different colors with different prices?",
      initialValue: false,
    }),

    defineField({
      name: "variants",
      title: "Product Variants",
      type: "array",
      description: "Different size and color combinations with their prices",
      hidden: ({ document }) =>
        Boolean(!document?.hasSizeOptions && !document?.hasColorOptions),
      validation: (rule) =>
        rule.custom((value, context) => {
          const hasSizeOptions = context.document?.hasSizeOptions;
          const hasColorOptions = context.document?.hasColorOptions;

          if (
            (hasSizeOptions || hasColorOptions) &&
            (!value || value.length === 0)
          ) {
            return "At least one variant is required when size or color options are enabled";
          }
          return true;
        }),
      of: [
        {
          type: "object",
          title: "Product Variant",
          fields: [
            defineField({
              name: "size",
              title: "Size",
              type: "string",
              description: "Size for this variant",
              hidden: ({ document }) => Boolean(!document?.hasSizeOptions),
              validation: (rule) =>
                rule.custom((value, context) => {
                  const hasSizeOptions = context.document?.hasSizeOptions;
                  if (hasSizeOptions && !value) {
                    return "Size is required when size options are enabled";
                  }
                  return true;
                }),
            }),
            defineField({
              name: "color",
              title: "Color",
              type: "string",
              description: "Color for this variant",
              hidden: ({ document }) => Boolean(!document?.hasColorOptions),
              validation: (rule) =>
                rule.custom((value, context) => {
                  const hasColorOptions = context.document?.hasColorOptions;
                  if (hasColorOptions && !value) {
                    return "Color is required when color options are enabled";
                  }
                  return true;
                }),
            }),
            defineField({
              name: "price",
              title: "Price (UGX)",
              type: "number",
              description: "Price for this specific variant",
              validation: (rule) =>
                rule
                  .required()
                  .min(100)
                  .error("Price must be at least 100 UGX"),
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
              description: "Number of units in stock for this variant",
              validation: (rule) =>
                rule
                  .required()
                  .min(0)
                  .error("Stock quantity cannot be negative"),
              initialValue: 0,
            }),
            defineField({
              name: "isActive",
              title: "Variant Available",
              type: "boolean",
              description: "Is this variant currently available?",
              initialValue: true,
            }),
          ],
          preview: {
            select: {
              size: "size",
              color: "color",
              price: "price",
              inventory: "inventory",
              isActive: "isActive",
              hasSizeOptions: "hasSizeOptions",
              hasColorOptions: "hasColorOptions",
            },
            prepare({ size, color, price, inventory, isActive }) {
            
              const nameParts = [size, color].filter(Boolean);
              const variantName =
                nameParts.length > 0 ? nameParts.join(" - ") : "Variant";

              const priceFormatted = price
                ? `${price.toLocaleString()} UGX`
                : "No price";
              const status = !isActive ? " (Inactive)" : "";
              const stockWarning = inventory <= 5 ? " ⚠️" : "";

              return {
                title: `${variantName}${status}`,
                subtitle: `${priceFormatted} • Stock: ${inventory}${stockWarning}`,
              };
            },
          },
        },
      ],
    }),

    defineField({
      name: "price",
      title: "Price (UGX)",
      type: "number",
      description: "Product price in Ugandan Shillings",
      hidden: ({ document }) =>
        Boolean(document?.hasSizeOptions || document?.hasColorOptions),
      validation: (rule) =>
        rule.custom((value, context) => {
          const hasSizeOptions = context.document?.hasSizeOptions;
          const hasColorOptions = context.document?.hasColorOptions;

          if (!hasSizeOptions && !hasColorOptions && (!value || value < 100)) {
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
      hidden: ({ document }) =>
        Boolean(document?.hasSizeOptions || document?.hasColorOptions),
      validation: (rule) => rule.min(100),
    }),

    defineField({
      name: "size",
      title: "Product Size",
      type: "string",
      description: "Size of this product",
      hidden: ({ document }) =>
        Boolean(document?.hasSizeOptions || document?.hasColorOptions),
      validation: (rule) =>
        rule.custom((value, context) => {
          const hasSizeOptions = context.document?.hasSizeOptions;
          const hasColorOptions = context.document?.hasColorOptions;

          if (!hasSizeOptions && !hasColorOptions && !value) {
            return "Product size is required";
          }
          return true;
        }),
    }),

    defineField({
      name: "inventory",
      title: "Stock Quantity",
      type: "number",
      description: "Number of units in stock",
      hidden: ({ document }) =>
        Boolean(document?.hasSizeOptions || document?.hasColorOptions),
      validation: (rule) =>
        rule.custom((value, context) => {
          const hasSizeOptions = context.document?.hasSizeOptions;
          const hasColorOptions = context.document?.hasColorOptions;

          if (
            !hasSizeOptions &&
            !hasColorOptions &&
            (value === undefined || value < 0)
          ) {
            return "Stock quantity cannot be negative";
          }
          return true;
        }),
      initialValue: 0,
    }),

    defineField({
      name: "discount",
      title: "Product Discount",
      type: "object",
      description: "Optional discount for this product",
      fields: [
        defineField({
          name: "type",
          title: "Discount Type",
          type: "string",
          options: {
            list: [
              { title: "No Discount", value: "none" },
              { title: "Percentage Off", value: "percentage" },
              { title: "Fixed Amount Off", value: "fixed_amount" },
            ],
            layout: "dropdown",
          },
          initialValue: "none",
        }),
        defineField({
          name: "value",
          title: "Discount Value",
          type: "number",
          description: "Percentage (1-99) or fixed amount in UGX (min 100)",
          hidden: ({ parent }) => parent?.type === "none",
          validation: (rule) =>
            rule.custom((value, context) => {
              const parent = context.parent as { type?: string };
              const discountType = parent?.type;

              // If no discount or discount type is "none", the value is optional
              if (!discountType || discountType === "none") {
                return true;
              }

              // If discount type is selected, then value is required
              if (typeof value !== "number") {
                return "Discount value is required when discount type is selected";
              }

              if (discountType === "percentage") {
                if (value > 99) {
                  return "Percentage discount cannot exceed 99%";
                }
                if (value < 1) {
                  return "Percentage discount must be at least 1%";
                }
              } else if (discountType === "fixed_amount") {
                if (value < 100) {
                  return "Fixed amount discount must be at least 100 UGX";
                }
              }

              return true;
            }),
        }),

        defineField({
          name: "title",
          title: "Discount Campaign Name",
          type: "string",
          description:
            'Internal name for this discount (e.g., "xmas Sale", "Launch Special")',
          hidden: ({ parent }) => parent?.type === "none",
        }),
        defineField({
          name: "isActive",
          title: "Discount Active",
          type: "boolean",
          description: "Is this discount currently active?",
          initialValue: true,
          hidden: ({ parent }) => parent?.type === "none",
        }),
        defineField({
          name: "startDate",
          title: "Start Date",
          type: "datetime",
          description: "When this discount becomes active",
          hidden: ({ parent }) => parent?.type === "none",
        }),
        defineField({
          name: "endDate",
          title: "End Date",
          type: "datetime",
          description: "When this discount expires",
          hidden: ({ parent }) => parent?.type === "none",
        }),
      ],
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
      name: "specifications",
      title: "Product Specifications",
      type: "object",
      description: "Key product details and specifications",
      fields: [
        defineField({
          name: "color",
          title: "Color",
          type: "string",
          description: "Product color (for display purposes - not pricing)",
          hidden: ({ document }) => Boolean(document?.hasColorOptions),
        }),
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
      name: "createdBy",
      title: "Created By",
      type: "string",
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
      size: "size",
      hasSizeOptions: "hasSizeOptions",
      hasColorOptions: "hasColorOptions",
      variants: "variants",
      categoryName: "category.name",
      isActive: "isActive",
      inStock: "inStock",
      inventory: "inventory",
      image: "images.0",
    },
    prepare({
      title,
      price,
      size,
      hasSizeOptions,
      hasColorOptions,
      variants,
      categoryName,
      isActive,
      inStock,
      inventory,
      image,
    }) {
      let priceDisplay = "";
      let variantInfo = "";
      let stockInfo = "";

      if (hasSizeOptions || hasColorOptions) {
        if (variants && variants.length > 0) {
          const prices = variants
            .map((v: { price: number }) => v.price)
            .filter(Boolean);
          if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            priceDisplay =
              minPrice === maxPrice
                ? `${minPrice.toLocaleString()} UGX`
                : `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} UGX`;
          }

          variantInfo = ` • ${variants.length} variant${variants.length === 1 ? "" : "s"}`;

          const totalStock = variants.reduce(
            (sum: number, v: { inventory: number }) => sum + (v.inventory || 0),
            0
          );

          if (totalStock <= 5) stockInfo = `Low Stock: ${totalStock}`;
        }
      } else {
        priceDisplay = price ? `${price.toLocaleString()} UGX` : "No price";
        variantInfo = size ? ` • ${size}` : "";
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
