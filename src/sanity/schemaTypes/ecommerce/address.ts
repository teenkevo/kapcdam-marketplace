import { defineType, defineField } from "sanity";

export const address = defineType({
  name: "address",
  title: "Address",
  type: "document",
  description: "Customer addresses for delivery and billing",
  fields: [
    defineField({
      name: "user",
      title: "User",
      type: "reference",
      description: "Reference to user who owns this address",
      to: [{ type: "user" }],
      validation: (rule) => rule.required().error("User reference is required"),
    }),
    defineField({
      name: "fullName",
      title: "Full Name",
      type: "string",
      description: "Full name of the recipient",
      validation: (rule) =>
        rule.required().min(2).error("Full name is required (minimum 2 characters)"),
    }),
    defineField({
      name: "label",
      title: "Address Label",
      type: "string",
      options: {
        list: [
          { title: "Home", value: "home" },
          { title: "Work", value: "work" },
          { title: "Other", value: "other" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required().error("Address label is required"),
    }),

    defineField({
      name: "isDefault",
      title: "Default Address",
      type: "boolean",
      description: "Is this the default delivery address?",
      initialValue: false,
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "phone",
      title: "Phone Number",
      type: "string",
      description: "Contact phone number",
      validation: (rule) =>
        rule
          .required()
          .regex(/^[+]?[0-9\s\-\(\)]{7,15}$/)
          .error("Enter a valid phone number"),
    }),

    defineField({
      name: "address",
      title: "Street Address",
      type: "text",
      description: "Street address, building, apartment number",
      validation: (rule) =>
        rule.required().min(5).error("Street address is required (minimum 5 characters)"),
      rows: 2,
    }),

    defineField({
      name: "landmark",
      title: "Nearest Landmark",
      type: "string",
      description: "Nearby landmark for easy location",
    }),

    defineField({
      name: "city",
      title: "City / Area",
      type: "string",
      description: "City or town",
      initialValue: "Kampala",
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "string",
      description: "Country",
      validation: (rule) => rule.required().error("Country is required"),
      initialValue: "Uganda",
    }),

    defineField({
      name: "deliveryInstructions",
      title: "Delivery Instructions",
      type: "text",
      description: "Special delivery instructions",
      rows: 2,
    }),

    defineField({
      name: "isActive",
      title: "Active",
      type: "boolean",
      description: "Is this address active/visible?",
      initialValue: true,
    }),

    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      description: "When this address was created",
      validation: (rule) => rule.required().error("Created at timestamp is required"),
      initialValue: () => new Date().toISOString(),
      // readOnly: true,
    }),

    defineField({
      name: "updatedAt",
      title: "Updated At",
      type: "datetime",
      description: "When this address was last updated",
      validation: (rule) => rule.required().error("Updated at timestamp is required"),
      initialValue: () => new Date().toISOString(),
    }),
  ],

  preview: {
    select: {
      fullName: "fullName",
      label: "label",
      address: "address",
      city: "city",
      userEmail: "user.email",
      isDefault: "isDefault",
    },
    prepare({ fullName, label, address, city, userEmail, isDefault }) {
      const labelText = label ? `(${label.charAt(0).toUpperCase() + label.slice(1)})` : "";
      const defaultText = isDefault ? " [Default]" : "";
      const location = [address, city].filter(Boolean).join(", ");
      const userDisplay = userEmail || "Unknown User";

      return {
        title: `${fullName}${labelText}${defaultText}`,
        subtitle: `${location} • ${userDisplay}`,
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
      title: "Default First",
      name: "defaultFirst",
      by: [
        { field: "isDefault", direction: "desc" },
        { field: "updatedAt", direction: "desc" },
      ],
    },
    {
      title: "User",
      name: "user",
      by: [{ field: "user.email", direction: "asc" }],
    },
  ],
});
