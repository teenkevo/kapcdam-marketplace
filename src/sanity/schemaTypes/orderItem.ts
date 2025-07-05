import { defineType, defineField } from "sanity";

export const orderItem = defineType({
  name: "orderItem",
  title: "Order Item",
  type: "document",
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
      name: "finalPrice",
      title: "Final Price (UGX)",
      type: "number",
      description: "Price after discount (originalPrice - discountApplied)",
      validation: (rule) =>
        rule.required().min(0).error("Final price must be a positive number"),
    }),

    defineField({
      name: "lineTotal",
      title: "Line Total (UGX)",
      type: "number",
      description: "Total for this line item (quantity × finalPrice)",
      validation: (rule) =>
        rule.required().min(0).error("Line total must be a positive number"),
    }),

    defineField({
      name: "product",
      title: "Product",
      type: "reference",
      description: "Reference to the product",
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
      name: "productVariant",
      title: "Product Variant",
      type: "reference",
      description: "Reference to the specific product variant ordered",
      to: [{ type: "productVariant" }],
      hidden: ({ document }) => document?.type !== "product",
      validation: (rule) =>
        rule.custom((value, context) => {
          const itemType = context.document?.type;
          if (itemType === "product" && !value) {
            return "Product variant reference is required when item type is product";
          }
          return true;
        }),
    }),

    defineField({
      name: "variantSnapshot",
      title: "Variant Snapshot",
      type: "object",
      description: "Snapshot of variant data at time of order",
      hidden: ({ document }) => document?.type !== "product",
      fields: [
        defineField({
          name: "size",
          title: "Variant Size",
          type: "string",
          description: "Variant size at time of order",
        }),
        defineField({
          name: "color",
          title: "Variant Color",
          type: "string",
          description: "Variant color at time of order",
        }),

        defineField({
          name: "name",
          title: "Variant Name",
          type: "string",
          description: "Variant name at time of order",
          readOnly: true,
        }),
      ],
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
      description: "When customer wants to start the course",
      hidden: ({ document }) => document?.type !== "course",
    }),

    defineField({
      name: "courseSnapshot",
      title: "Course Snapshot",
      type: "object",
      description: "Snapshot of course data at time of order",
      hidden: ({ document }) => document?.type !== "course",
      fields: [
        defineField({
          name: "title",
          title: "Course Title",
          type: "string",
          description: "Course name at time of order",
        }),
        defineField({
          name: "description",
          title: "Course Description",
          type: "text",
          description: "Course description at time of order",
        }),
        defineField({
          name: "duration",
          title: "Duration",
          type: "string",
          description: "Course duration at time of order",
        }),
        defineField({
          name: "skillLevel",
          title: "Skill Level",
          type: "string",
          description: "Course skill level at time of order",
        }),
      ],
    }),

    defineField({
      name: "fulfillmentStatus",
      title: "Fulfillment Status",
      type: "string",
      description: "Status of this specific item",
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
      validation: (rule) =>
        rule.required().error("Fulfillment status is required"),
      initialValue: "pending",
    }),

    defineField({
      name: "fulfillmentNotes",
      title: "Fulfillment Notes",
      type: "text",
      description: "Notes about fulfilling this specific item",
      rows: 2,
    }),

    defineField({
      name: "addedAt",
      title: "Added At",
      type: "datetime",
      description: "When this item was added to the order",
      validation: (rule) =>
        rule.required().error("Added at timestamp is required"),
      initialValue: () => new Date().toISOString(),
    }),

    defineField({
      name: "isActive",
      title: "Item Active",
      type: "boolean",
      description: "Is this item active/visible?",
      initialValue: true,
    }),
  ],

  preview: {
    select: {
      type: "type",
      quantity: "quantity",
      finalPrice: "finalPrice",
      lineTotal: "lineTotal",
      productTitle: "product.title",
      courseTitle: "course.title",
      fulfillmentStatus: "fulfillmentStatus",
      variantSize: "productVariant.size",
      variantColor: "productVariant.color",
      orderNumber: "order.orderNumber",
    },
    prepare({
      type,
      quantity,
      finalPrice,
      lineTotal,
      productTitle,
      courseTitle,
      variantSize,
      variantColor,
      orderNumber,
    }) {
      const itemName = type === "product" ? productTitle : courseTitle;

      const priceFormatted = finalPrice
        ? `${finalPrice.toLocaleString()} UGX`
        : "No price";
      const totalFormatted = lineTotal
        ? `${lineTotal.toLocaleString()} UGX`
        : "No total";

      const variantInfo = [];
      if (variantSize) variantInfo.push(variantSize);
      if (variantColor) variantInfo.push(variantColor);
      const variants =
        variantInfo.length > 0 ? ` • ${variantInfo.join(", ")}` : "";
      const quantityInfo = quantity ? ` (${quantity}x)` : "";

      const orderInfo = orderNumber ? ` • ${orderNumber}` : "";

      return {
        title: `${itemName || "Unknown Item"}${quantityInfo}${variants}`,
        subtitle: `${priceFormatted} → ${totalFormatted}${orderInfo}`,
        media: null,
      };
    },
  },

  orderings: [
    {
      title: "Recent Items",
      name: "recentItems",
      by: [{ field: "addedAt", direction: "desc" }],
    },
    {
      title: "Line Total: High to Low",
      name: "lineTotalDesc",
      by: [{ field: "lineTotal", direction: "desc" }],
    },
    {
      title: "Fulfillment Status",
      name: "fulfillmentStatus",
      by: [{ field: "fulfillmentStatus", direction: "asc" }],
    },
    {
      title: "Item Type",
      name: "itemType",
      by: [{ field: "type", direction: "asc" }],
    },
  ],
});
