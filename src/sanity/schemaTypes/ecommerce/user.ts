import { defineType, defineField, defineArrayMember } from "sanity";

export const user = defineType({
  name: "user",
  title: "Customer User",
  type: "document",
  // readOnly: true,
  description:
    "Customer users for KAPCDAM e-commerce platform. Authentication handled by Clerk.",
  fields: [
    defineField({
      name: "clerkUserId",
      title: "Clerk User ID",
      type: "string",
      description: "Unique identifier from Clerk authentication",
      validation: (rule) => rule.required().error("Clerk User ID is required"),
    }),

    defineField({
      name: "email",
      title: "Email Address",
      type: "string",
      description: "User email address (synced from Clerk)",
      validation: (rule) =>
        rule.required().email().error("Valid email address is required"),
    }),

    defineField({
      name: "firstName",
      title: "First Name",
      type: "string",
      validation: (rule) =>
        rule
          .required()
          .min(2)
          .max(50)
          .error("First name is required (2-50 characters)"),
    }),

    defineField({
      name: "lastName",
      title: "Last Name",
      type: "string",
      validation: (rule) =>
        rule
          .required()
          .min(2)
          .max(50)
          .error("Last name is required (2-50 characters)"),
    }),

    defineField({
      name: "phone",
      title: "Phone Number",
      type: "string",
      description: "Primary contact phone number",
      validation: (rule) =>
        rule
          .regex(/^[+]?[0-9\s\-\(\)]{7,15}$/)
          .error("Enter a valid phone number"),
    }),

    defineField({
      name: "likedProducts",
      title: "Liked Products",
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "product" }],
        }),
      ],
    }),
    defineField({
      name: "preferences",
      title: "User Preferences",
      type: "object",
      fields: [
        defineField({
          name: "notifications",
          title: "Email/SMS Notifications",
          type: "boolean",
          description: "Receive order updates and notifications",
          initialValue: true,
        }),

        defineField({
          name: "marketing",
          title: "Marketing Communications",
          type: "boolean",
          description: "Receive promotional emails and offers",
          initialValue: false,
        }),
      ],
    }),
  ],

  preview: {
    select: {
      firstName: "firstName",
      lastName: "lastName",
      email: "email",
    },
    prepare({ firstName, lastName, email }) {
      const name = [firstName, lastName].filter(Boolean).join(" ") || "No name";

      return {
        title: name,
        subtitle: `${email || "No email"}`,
      };
    },
  },

  orderings: [
    {
      title: "Name A-Z",
      name: "nameAsc",
      by: [
        { field: "firstName", direction: "asc" },
        { field: "lastName", direction: "asc" },
      ],
    },
    {
      title: "Name Z-A",
      name: "nameDesc",
      by: [
        { field: "firstName", direction: "desc" },
        { field: "lastName", direction: "desc" },
      ],
    },
  ],
});
