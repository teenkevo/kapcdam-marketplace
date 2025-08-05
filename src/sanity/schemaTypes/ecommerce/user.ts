import { defineType, defineField, defineArrayMember } from "sanity";

export const user = defineType({
  name: "user",
  title: "Customer User",
  type: "document",
  readOnly: true,
  description:
    "Customer users for KAPCDAM e-commerce platform. Authentication handled by Clerk.",

  // Document-level validation for uniqueness (updated to consider deactivated users)
  validation: (rule) =>
    rule.custom(async (document, context) => {
      if (!document?.clerkUserId && !document?.email) return true;

      const { getClient } = context;
      const client = getClient({ apiVersion: "2025-02-06" });

      const currentId = document._id?.replace(/^drafts\./, "") || "";
      const errors: string[] = [];

      if (document.clerkUserId) {
        const existingClerkUsers = await client.fetch(
          `count(*[_type == "user" && clerkUserId == $clerkUserId && status == "active" && !(_id in [$draftId, $publishedId])])`,
          {
            clerkUserId: document.clerkUserId,
            draftId: `drafts.${currentId}`,
            publishedId: currentId,
          }
        );

        if (existingClerkUsers > 0) {
          errors.push(
            `An active user with Clerk ID "${document.clerkUserId}" already exists.`
          );
        }
      }

      if (document.email) {
        const existingEmailUsers = await client.fetch(
          `count(*[_type == "user" && email == $email && status == "active" && !(_id in [$draftId, $publishedId])])`,
          {
            email: document.email,
            draftId: `drafts.${currentId}`,
            publishedId: currentId,
          }
        );

        if (existingEmailUsers > 0) {
          errors.push(
            `An active user with email "${document.email}" already exists.`
          );
        }
      }

      if (document.status === "active" && document.email) {
        const deactivatedUserWithSameEmail = await client.fetch(
          `*[_type == "user" && email == $email && status == "deactivated" && !(_id in [$draftId, $publishedId])][0]`,
          {
            email: document.email,
            draftId: `drafts.${currentId}`,
            publishedId: currentId,
          }
        );

        if (
          deactivatedUserWithSameEmail &&
          deactivatedUserWithSameEmail.clerkUserId !== document.clerkUserId
        ) {
          errors.push(
            `A deactivated user with email "${document.email}" exists with different Clerk ID. Use the webhook to properly reactivate users.`
          );
        }
      }

      return errors.length > 0 ? errors.join(" ") : true;
    }),

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
      name: "status",
      title: "User Status",
      type: "string",
      description: "The current status of the user's account.",
      options: {
        list: [
          { title: "Active", value: "active" },
          { title: "Deactivated", value: "deactivated" },
          { title: "Archived", value: "archived" },
        ],
        layout: "dropdown",
      },
      initialValue: "active",
      validation: (rule) => rule.required(),
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

    defineField({
      name: "deactivatedAt",
      title: "Deactivated At",
      type: "datetime",
      description: "When the user account was deactivated",
      hidden: ({ document }) => document?.status !== "deactivated",
      readOnly: true,
    }),

    defineField({
      name: "deactivationReason",
      title: "Deactivation Reason",
      type: "string",
      description: "Reason for account deactivation",
      options: {
        list: [
          { title: "User Deleted Account", value: "user_deleted" },
          { title: "Admin Deactivated", value: "admin_deactivated" },
          { title: "Compliance/GDPR", value: "compliance" },
          { title: "Orphaned Account", value: "orphaned" },
        ],
        layout: "dropdown",
      },
      hidden: ({ document }) => document?.status !== "deactivated",
    }),
  ],

  preview: {
    select: {
      firstName: "firstName",
      lastName: "lastName",
      email: "email",
      status: "status",
    },
    prepare({ firstName, lastName, email, status }) {
      const name = [firstName, lastName].filter(Boolean).join(" ") || "No name";
      const statusDisplay =
        status === "deactivated"
          ? " (Deactivated)"
          : status === "archived"
            ? " (Archived)"
            : "";

      return {
        title: `${name}${statusDisplay}`,
        subtitle: `${email || "No email"}`,
      };
    },
  },

  orderings: [
    {
      title: "Active Users First",
      name: "statusActive",
      by: [
        { field: "status", direction: "asc" },
        { field: "firstName", direction: "asc" },
      ],
    },
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
