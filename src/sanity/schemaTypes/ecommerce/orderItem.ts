import { defineType, defineField } from "sanity";

export const orderItem = defineType({
  name: "orderItem",
  title: "Order Item",
  type: "document",
  readOnly: true,
  description: "Individual items within an order (products or courses)",
  fields: [
    defineField({
      name: "order",
      title: "Order",
      type: "reference",
      description: "Reference to the parent order",
      to: [{ type: "order" }],
      validation: (rule) =>
        rule.required().error("Order reference is required"),
    }),

    defineField({
      name: "type",
      title: "Item Type",
      type: "string",
      description: "Type of item in this order",
      options: {
        list: [
          { title: "Product", value: "product" },
          { title: "Course", value: "course" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required().error("Item type is required"),
    }),

    defineField({
      name: "name",
      title: "Item Name",
      type: "string",
      description: "Amazon-style display name (e.g., 'iPhone 11 Pro Storage - 256GB, Color - Peach')",
      validation: (rule) => rule.required().error("Item name is required"),
    }),

    defineField({
      name: "variantSku",
      title: "Variant SKU",
      type: "string",
      description: "SKU for product variants (displayed below title)",
      hidden: ({ document }) => document?.type !== "product",
    }),

    defineField({
      name: "quantity",
      title: "Quantity",
      type: "number",
      description: "Number of items",
      validation: (rule) =>
        rule.required().min(1).error("Quantity must be at least 1"),
    }),

    defineField({
      name: "originalPrice",
      title: "Original Price (UGX)",
      type: "number",
      description: "Price before any discount",
      validation: (rule) =>
        rule
          .required()
          .min(0)
          .error("Original price must be a positive number"),
    }),

    defineField({
      name: "discountApplied",
      title: "Discount Applied (UGX)",
      type: "number",
      description: "Discount amount for this specific item",
      validation: (rule) =>
        rule.min(0).error("Discount amount cannot be negative"),
      initialValue: 0,
    }),

    defineField({
      name: "unitPrice",
      title: "Unit Price (UGX)",
      type: "number",
      description: "Final price after discount (originalPrice - discountApplied)",
      validation: (rule) =>
        rule.required().min(0).error("Unit price must be a positive number"),
    }),

    defineField({
      name: "lineTotal",
      title: "Line Total (UGX)",
      type: "number",
      description: "Total for this line item (quantity × unitPrice)",
      validation: (rule) =>
        rule.required().min(0).error("Line total must be a positive number"),
    }),

    defineField({
      name: "product",
      title: "Product",
      type: "reference",
      description: "Reference to the original product (for both products and variants)",
      to: [{ type: "product" }], 
      hidden: ({ document }) => document?.type !== "product",
      validation: (rule) =>
        rule.custom((value, context) => {
          const itemType = context.document?.type;
          if (itemType === "product" && !value) {
            return "Product reference is required when item type is product";
          }
          return true;
        }),
    }),

    defineField({
      name: "course",
      title: "Course",
      type: "reference",
      description: "Reference to the course",
      to: [{ type: "course" }],
      hidden: ({ document }) => document?.type !== "course",
      validation: (rule) =>
        rule.custom((value, context) => {
          const itemType = context.document?.type;
          if (itemType === "course" && !value) {
            return "Course reference is required when item type is course";
          }
          return true;
        }),
    }),

    defineField({
      name: "preferredStartDate",
      title: "Preferred Start Date",
      type: "datetime",
      description: "Preferred course start date",
      hidden: ({ document }) => document?.type !== "course",
    }),

    defineField({
      name: "fulfillmentStatus",
      title: "Fulfillment Status",
      type: "string",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Confirmed", value: "confirmed" },
          { title: "Preparing", value: "preparing" },
          { title: "Ready", value: "ready" },
          { title: "Shipped", value: "shipped" },
          { title: "Delivered", value: "delivered" },
          { title: "Cancelled", value: "cancelled" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required(),
      initialValue: "pending",
    }),

    defineField({
      name: "fulfillmentNotes",
      title: "Fulfillment Notes",
      type: "text",
      description: "Internal notes for fulfillment team",
      rows: 2,
    }),
  ],

  preview: {
    select: {
      name: "name",
      variantSku: "variantSku",
      quantity: "quantity",
      unitPrice: "unitPrice",
      lineTotal: "lineTotal",
      orderNumber: "order.orderNumber",
    },
    prepare({
      name,
      variantSku,
      quantity,
      unitPrice,
      lineTotal,
      orderNumber,
    }) {
      const priceFormatted = unitPrice
        ? `${unitPrice.toLocaleString()} UGX`
        : "No price";
      const totalFormatted = lineTotal
        ? `${lineTotal.toLocaleString()} UGX`
        : "No total";
      const quantityInfo = quantity ? ` (${quantity}x)` : "";
      const orderInfo = orderNumber ? ` • ${orderNumber}` : "";

      // Create a cleaner title with SKU on separate line if available
      const titleText = `${name || "Unknown Item"}${quantityInfo}`;
      const skuLine = variantSku ? `\nSKU: ${variantSku}` : "";
      const priceInfo = `${priceFormatted} → ${totalFormatted}${orderInfo}`;

      return {
        title: titleText + skuLine,
        subtitle: priceInfo,
      };
    },
  },
  orderings: [
    {
      title: "Recent Items",
      name: "recentItems",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
    {
      title: "Line Total: High to Low",
      name: "lineTotalDesc",
      by: [{ field: "lineTotal", direction: "desc" }],
    },
  ],
});
