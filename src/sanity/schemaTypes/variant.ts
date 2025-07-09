import { defineType, defineField } from "sanity";
import { SizeInput } from "../components/size-selector";

export const productVariant = defineType({
  name: "productVariant",
  title: "Product Variant",
  type: "document",
  description:
    "Individual product variants with specific size, color, and pricing",
  fields: [
    defineField({
      name: "product",
      title: "Product",
      type: "reference",
      description: "The main product this variant belongs to",
      to: [{ type: "product" }],
      validation: (rule) =>
        rule.required().error("Product reference is required"),
    }),

    defineField({
      name: "variantName",
      title: "Variant Name",
      type: "string",
      description: "Display name for this variant (auto-generated if empty)",
      readOnly: true,
    }),

    defineField({
      name: "size",
      title: "Size",
      type: "string",
      description: "Size for this variant (options based on product category)",
      components: {
        input:SizeInput,
      },
    }),

    defineField({
      name: "color",
      title: "Color",
      type: "string",
      description:
        "Color for this variant (e.g., 'Red', 'Lavender', 'Natural')",
    }),

    defineField({
      name: "price",
      title: "Price (UGX)",
      type: "number",
      description: "Price for this specific variant",
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
      description: "Number of units in stock for this variant",
      validation: (rule) =>
        rule.required().min(0).error("Stock quantity cannot be negative"),
      initialValue: 0,
    }),

    defineField({
      name: "lowStockThreshold",
      title: "Low Stock Threshold",
      type: "number",
      description: "Alert when stock goes below this number",
      validation: (rule) =>
        rule.min(0).error("Low stock threshold cannot be negative"),
      initialValue: 5,
    }),

    defineField({
      name: "isActive",
      title: "Variant Available",
      type: "boolean",
      description: "Is this variant currently available for purchase?",
      initialValue: true,
    }),

    defineField({
      name: "isDefault",
      title: "Default Variant",
      type: "boolean",
      description: "Is this the default variant shown for the product?",
      initialValue: false,
    }),

    defineField({
      name: "specifications",
      title: "Variant Specifications",
      type: "object",
      description: "Specifications specific to this variant",
      fields: [
        defineField({
          name: "weight",
          title: "Weight",
          type: "string",
          description: "Specific weight for this variant",
        }),
        defineField({
          name: "dimensions",
          title: "Dimensions",
          type: "string",
          description: "Specific dimensions for this variant",
        }),
        defineField({
          name: "additionalInfo",
          title: "Additional Information",
          type: "text",
          description: "Any additional information specific to this variant",
          rows: 2,
        }),
      ],
    }),

    defineField({
      name: "discountType",
      title: "Discount Type",
      type: "string",
      description: "Discount type for this variant",
      options: {
        list: [
          { title: "Percentage", value: "percentage" },
          { title: "Fixed Amount", value: "fixed" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required().error("Discount type is required"),
    }),

    defineField({
      name: "discountValue",
      title: "Discount Value",
      type: "number",
      description: "Discount value for this variant",
      validation: (rule) =>
        rule.required().min(1).error("Discount value must be at least 1"),
    }),

    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      description: "Order in which this variant appears (lower numbers first)",
      initialValue: 0,
    }),

    defineField({
      name: "notes",
      title: "Internal Notes",
      type: "text",
      description: "Internal notes about this variant",
      rows: 2,
    }),
  ],

  validation: (Rule) =>
    Rule.custom((document) => {
      if (!document?.size && !document?.color) {
        return "Variant must have either a size or color (or both)";
      }

      return true;
    }),

  preview: {
    select: {
      productTitle: "product.title",
      size: "size",
      color: "color",
      price: "price",
      inventory: "inventory",
      isActive: "isActive",
      isDefault: "isDefault",
      image: "images.0",
      productImage: "product.images.0",
    },
    prepare({
      productTitle,
      size,
      color,
      price,
      inventory,
      isActive,
      isDefault,
      image,
      productImage,
    }) {
      const nameParts = [size, color].filter(Boolean);
      const variantName =
        nameParts.length > 0 ? nameParts.join(" - ") : "Base Variant";

      const priceFormatted = price
        ? `${price.toLocaleString()} UGX`
        : "No price";

      let status = "";
      if (isDefault) status = "(Default)";
      if (!isActive) status += "(Inactive)";
      else if (inventory <= 5 && inventory > 0) status += "(Low Stock)";
      else if (inventory === 0) status += "(Out of Stock)";

      const stockInfo = ` • Stock: ${inventory}`;

      return {
        title: `${status}${productTitle} - ${variantName}`,
        subtitle: `${priceFormatted}${stockInfo}`,
        media: image || productImage,
      };
    },
  },

  orderings: [
    {
      title: "Product Name",
      name: "productName",
      by: [{ field: "product.title", direction: "asc" }],
    },
    {
      title: "Sort Order",
      name: "sortOrder",
      by: [{ field: "sortOrder", direction: "asc" }],
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
