import { defineType, defineField } from "sanity";

export const cart = defineType({
  name: "cart",
  title: "Shopping Cart",
  type: "document",
  description:
    "Customer shopping cart - one cart per user, immediate cleanup after orders",
  fields: [
    defineField({
      name: "user",
      title: "User",
      type: "reference",
      description: "Reference to user document (unique per active cart)",
      to: [{ type: "user" }],
      validation: (rule) => rule.required().error("User reference is required"),
    }),

    defineField({
      name: "cartItems",
      title: "Cart Items",
      type: "array",
      description: "Items in the shopping cart",
      of: [
        {
          type: "object",
          title: "Cart Item",
          fields: [
            defineField({
              name: "type",
              title: "Item Type",
              type: "string",
              description: "Type of item",
              options: {
                list: [
                  { title: "Product", value: "product" },
                  { title: "Course", value: "course" },
                ],
                layout: "radio",
              },
              validation: (rule) =>
                rule.required().error("Item type is required"),
            }),

            defineField({
              name: "quantity",
              title: "Quantity",
              type: "number",
              description: "Number of items",
              validation: (rule) =>
                rule.required().min(1).error("Quantity must be at least 1"),
              initialValue: 1,
            }),

            defineField({
              name: "currentPrice",
              title: "Current Price (UGX)",
              type: "number",
              description: "Current price for real-time totals",
              validation: (rule) =>
                rule
                  .required()
                  .min(0)
                  .error("Current price must be a positive number"),
            }),

            defineField({
              name: "product",
              title: "Product",
              type: "reference",
              description: "Reference to the product",
              to: [{ type: "product" }],
              hidden: ({ parent }) => parent?.type !== "product",
              validation: (rule) =>
                rule.required().error("Product reference is required"),
            }),

            defineField({
              name: "productVariant",
              title: "Product Variant",
              type: "reference",
              description: "Reference to the specific product variant",
              to: [{ type: "productVariant" }],
              hidden: ({ parent }) => parent?.type !== "product",
              validation: (rule) =>
                rule.required().error("Product variant reference is required"),
            }),

            defineField({
              name: "course",
              title: "Course",
              type: "reference",
              description: "Reference to the course",
              to: [{ type: "course" }],
              hidden: ({ parent }) => parent?.type !== "course",
              validation: (rule) =>
                rule.required().error("Course reference is required"),
            }),

            defineField({
              name: "preferredStartDate",
              title: "Preferred Start Date",
              type: "datetime",
              description: "When customer wants to start the course",
              hidden: ({ parent }) => parent?.type !== "course",
            }),

            defineField({
              name: "addedAt",
              title: "Added At",
              type: "datetime",
              description: "When this item was added to cart",
              validation: (rule) =>
                rule.required().error("Added at timestamp is required"),
              initialValue: () => new Date().toISOString(),
            }),

            defineField({
              name: "lastUpdated",
              title: "Last Updated",
              type: "datetime",
              description: "When this item was last modified",
              initialValue: () => new Date().toISOString(),
            }),
          ],
          preview: {
            select: {
              type: "type",
              quantity: "quantity",
              currentPrice: "currentPrice",
              productTitle: "product.title",
              courseTitle: "course.title",
              selectedSize: "selectedSize",
              selectedColor: "selectedColor",
            },
            prepare({
              type,
              quantity,
              currentPrice,
              productTitle,
              courseTitle,
              selectedSize,
              selectedColor,
            }) {
              const itemName = type === "product" ? productTitle : courseTitle;
              const itemType = type === "product" ? "(Product)" : "(Course)";

              const priceFormatted = currentPrice
                ? `${currentPrice.toLocaleString()} UGX`
                : "No price";
              const quantityInfo = quantity ? ` (${quantity}x)` : "";

              const variantInfo = [];
              if (selectedSize) variantInfo.push(selectedSize);
              if (selectedColor) variantInfo.push(selectedColor);
              const variants =
                variantInfo.length > 0 ? ` • ${variantInfo.join(", ")}` : "";

              return {
                title: `${itemType} ${itemName || "Unknown Item"}${quantityInfo}`,
                subtitle: `${priceFormatted}${variants}`,
              };
            },
          },
        },
      ],
    }),

    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      description: "Cart creation timestamp",
      validation: (rule) =>
        rule.required().error("Created at timestamp is required"),
      initialValue: () => new Date().toISOString(),
    }),

    defineField({
      name: "updatedAt",
      title: "Updated At",
      type: "datetime",
      description: "Last modification timestamp",
      validation: (rule) =>
        rule.required().error("Updated at timestamp is required"),
      initialValue: () => new Date().toISOString(),
    }),

    defineField({
      name: "itemCount",
      title: "Item Count",
      type: "number",
      description: "Total number of items in cart",
      validation: (rule) => rule.min(0).error("Item count cannot be negative"),
      initialValue: 0,
    }),

    defineField({
      name: "subtotal",
      title: "Subtotal (UGX)",
      type: "number",
      description: "Cart subtotal (sum of all item totals)",
      validation: (rule) => rule.min(0).error("Subtotal cannot be negative"),
      initialValue: 0,
    }),

    defineField({
      name: "isActive",
      title: "Cart Active",
      type: "boolean",
      description: "Is this cart active/visible?",
      initialValue: true,
    }),

    defineField({
      name: "sessionId",
      title: "Session ID",
      type: "string",
      description: "Browser session identifier (for guest cart merging)",
    }),

    defineField({
      name: "convertedToOrder",
      title: "Converted to Order",
      type: "reference",
      description: "Order this cart was converted to (if any)",
      to: [{ type: "order" }],
    }),

    defineField({
      name: "convertedAt",
      title: "Converted At",
      type: "datetime",
      description: "When cart was converted to order",
      hidden: ({ document }) => !document?.convertedToOrder,
    }),
  ],

  preview: {
    select: {
      userEmail: "user.email",
      userName: "user.firstName",
      itemCount: "itemCount",
      subtotal: "subtotal",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      isActive: "isActive",
      convertedToOrder: "convertedToOrder",
      cartItems: "cartItems",
    },
    prepare({ userEmail, userName, itemCount, subtotal, updatedAt }) {
      const totalFormatted = subtotal
        ? `${subtotal.toLocaleString()} UGX`
        : "0 UGX";
      const itemsText = itemCount === 1 ? "item" : "items";
      const itemCountText = itemCount ? `${itemCount} ${itemsText}` : "Empty";

      const date = updatedAt ? new Date(updatedAt).toLocaleDateString() : "";

      const userDisplay = userName || userEmail || "Unknown User";

      return {
        title: `${userDisplay}`,
        subtitle: `${itemCountText} • ${totalFormatted} • ${date}`,
        media: null,
      };
    },
  },

  orderings: [
    {
      title: "Recently Updated",
      name: "recentlyUpdated",
      by: [{ field: "updatedAt", direction: "desc" }],
    },
    {
      title: "Recently Created",
      name: "recentlyCreated",
      by: [{ field: "createdAt", direction: "desc" }],
    },
    {
      title: "Cart Value: High to Low",
      name: "subtotalDesc",
      by: [{ field: "subtotal", direction: "desc" }],
    },
    {
      title: "Item Count: High to Low",
      name: "itemCountDesc",
      by: [{ field: "itemCount", direction: "desc" }],
    },
    {
      title: "User",
      name: "user",
      by: [{ field: "user.email", direction: "asc" }],
    },
  ],
});
