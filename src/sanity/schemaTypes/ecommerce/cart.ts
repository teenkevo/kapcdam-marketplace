import { defineType, defineField } from "sanity";

/**
 * Defines a simple "forever cart" for each user.
 * This schema assumes a one-to-one relationship between a user and their cart.
 * Instead of deactivating or converting the cart, the application logic will
 * simply clear the `cartItems` array after an order is successfully created.
 */
export const cart = defineType({
  name: "cart",
  title: "Shopping Cart",
  type: "document",
  description: "A user's persistent shopping cart.",
  readOnly: true,
  fields: [
    defineField({
      name: "user",
      title: "User",
      type: "reference",
      description:
        "The user this cart belongs to. Each user must have only one cart.",
      to: [{ type: "user" }],
      validation: (rule) =>
        rule.required().custom(async (userRef, context) => {
          if (!userRef?._ref) return true;

          const { getClient, document } = context;
          const client = getClient({ apiVersion: "2025-02-06" });

          // Get the current document ID, handling both drafts and published
          const currentId = document?._id.replace(/^drafts\./, "");

          // Query for existing carts with the same user reference
          const existingCarts = await client.fetch(
            `count(*[_type == "cart" && user._ref == $userRef && !(_id in [$draftId, $publishedId])])`,
            {
              userRef: userRef._ref,
              draftId: `drafts.${currentId}`,
              publishedId: currentId,
            }
          );

          return existingCarts > 0
            ? "This user already has a cart. Each user can only have one cart."
            : true;
        }),
    }),

    defineField({
      name: "cartItems",
      title: "Cart Items",
      type: "array",
      description: "A list of items in the shopping cart.",
      of: [
        {
          type: "object",
          title: "Cart Item",
          fields: [
            defineField({
              name: "type",
              title: "Item Type",
              type: "string",
              options: {
                list: [
                  { title: "Product", value: "product" },
                  { title: "Course", value: "course" },
                ],
                layout: "dropdown",
              },
              validation: (rule) => rule.required(),
            }),

            // The quantity of the item.
            defineField({
              name: "quantity",
              title: "Quantity",
              type: "number",
              description: "Number of this specific item.",
              validation: (rule) =>
                rule.required().min(1).error("Quantity must be at least 1."),
              initialValue: 1,
            }),

            defineField({
              name: "product",
              title: "Product",
              type: "reference",
              to: [{ type: "product" }],
              // Only show this field if the item type is 'product'.
              hidden: ({ parent }) => parent?.type !== "product",
            }),

            // Stores the specific variant (e.g., 'Large', 'Blue').
            defineField({
              name: "selectedVariantSku",
              title: "Selected Variant SKU",
              type: "string",
              description:
                "SKU of the selected product variant, if applicable.",
              hidden: ({ parent }) => parent?.type !== "product",
            }),

            // Reference to the course document (if type is 'course').
            defineField({
              name: "course",
              title: "Course",
              type: "reference",
              to: [{ type: "course" }],
              // Only show this field if the item type is 'course'.
              hidden: ({ parent }) => parent?.type !== "course",
            }),

            // The user's desired start date for a course.
            defineField({
              name: "preferredStartDate",
              title: "Preferred Start Date",
              type: "datetime",
              description: "When the customer wants to start the course.",
              // Only show this field if the item type is 'course'.
              hidden: ({ parent }) => parent?.type !== "course",
            }),
          ],
          preview: {
            select: {
              type: "type",
              quantity: "quantity",
              productTitle: "product.title",
              courseTitle: "course.title",
              variantSku: "selectedVariantSku",
            },
            prepare({ type, quantity, productTitle, courseTitle, variantSku }) {
              const itemTitle = type === "product" ? productTitle : courseTitle;
              const variantInfo = variantSku ? ` (${variantSku})` : "";
              return {
                title: `${itemTitle}${variantInfo}`,
                subtitle: `Quantity: ${quantity}`,
              };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      userEmail: "user.email",
      cartItems: "cartItems",
    },
    prepare({ userEmail, cartItems }) {
      const totalItems =
        cartItems?.reduce((total: number, item: any) => {
          return total + (item.quantity || 0);
        }, 0) || 0;

      const itemsText = totalItems === 1 ? "item" : "items";
      const subtitle =
        totalItems > 0 ? `${totalItems} ${itemsText}` : "Empty cart";

      return {
        title: `Cart for ${userEmail || "Unknown User"}`,
        subtitle: subtitle,
      };
    },
  },
});
