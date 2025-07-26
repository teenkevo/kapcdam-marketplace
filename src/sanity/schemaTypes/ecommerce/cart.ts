import { defineType, defineField } from "sanity";

export const cart = defineType({
  name: "cart",
  title: "Shopping Cart",
  type: "document",
  description: "Customer shopping cart",
  readOnly: true,
  fields: [
    defineField({
      name: "user",
      title: "User",
      type: "reference",
      description: "Reference to user document ",
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
                layout: "dropdown",
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
              name: "product",
              title: "Product",
              type: "reference",
              description: "Reference to the specific product",
              to: [{ type: "product" }],
              hidden: ({ parent }) => parent?.type !== "product",
              validation: (rule) =>
                rule.custom((value, context) => {
                  if ((context.parent as any)?.type === "product" && !value) {
                    return "Product reference is required";
                  }
                  return true;
                }),
            }),

            defineField({
              name: "selectedVariantSku",
              title: "Selected Variant SKU",
              type: "string",
              description:
                "SKU of the selected variant (if product has variants)",
              hidden: ({ parent }) => parent?.type !== "product",
              validation: (rule) =>
                rule.custom((value, context) => {
                  return true;
                }),
            }),

            defineField({
              name: "course",
              title: "Course",
              type: "reference",
              description: "Reference to the course",
              to: [{ type: "course" }],
              hidden: ({ parent }) => parent?.type !== "course",
              validation: (rule) =>
                rule.custom((value, context) => {
                  if ((context.parent as any)?.type === "course" && !value) {
                    return "Course reference is required";
                  }
                  return true;
                }),
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
              productTitle: "product.title",
              selectedVariantSku: "selectedVariantSku",
              courseTitle: "course.title",
            },
            prepare({
              type,
              quantity,
              currentPrice,
              productTitle,
              selectedVariantSku,
              courseTitle,
            }) {
              let itemName;
              if (type === "product") {
                itemName = selectedVariantSku
                  ? `${productTitle} (${selectedVariantSku})`
                  : productTitle;
              } else {
                itemName = courseTitle;
              }

              const itemType = type === "product" ? "(Product)" : "(Course)";
              const priceFormatted = currentPrice
                ? `${currentPrice.toLocaleString()} UGX`
                : "No price";
              const quantityInfo = quantity ? ` (${quantity}x)` : "";

              return {
                title: `${itemType} ${itemName || "Unknown Item"}${quantityInfo}`,
                subtitle: `${priceFormatted}`,
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
      name: "isActive",
      title: "Cart Active",
      type: "boolean",
      description: "Is this cart active/visible?",
      initialValue: true,
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
      isActive: "isActive",
    },
    prepare({ userEmail, userName, itemCount, isActive }) {
      const itemsText = itemCount === 1 ? "item" : "items";
      const itemCountText = itemCount ? `${itemCount} ${itemsText}` : "Empty";
      const userDisplay = userName || userEmail || "Unknown User";

      const status = !isActive ? " (Inactive)" : "";

      return {
        title: `${userDisplay}${status}`,
        subtitle: `${itemCountText}`,
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
