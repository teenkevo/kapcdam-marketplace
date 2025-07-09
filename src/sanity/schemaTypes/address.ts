import { defineType, defineField } from "sanity";

export const address = defineType({
  name: "address",
  title: "Address",
  type: "object",
  description: "Delivery address powered by Google Maps",
  fields: [
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
        layout: "radio",
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
      title: "Contact Phone",
      type: "string",
      description: "Phone number for delivery contact at this address",
      validation: (rule) =>
        rule
          .regex(/^[+]?[0-9\s\-\(\)]{7,15}$/)
          .error("Enter a valid phone number"),
    }),

    defineField({
      name: "address",
      title: "Complete Address",
      type: "text",
      description: "Full street address",
      validation: (rule) => rule.required().error("Address is required"),
      rows: 2,
    }),

    defineField({
      name: "landmark",
      title: "Nearest Landmark",
      type: "text",
      description: "Apartment, suite, nearest landmark, etc",
      rows: 1,
    }),

    defineField({
      name: "locality",
      title: "City/Area",
      type: "string",
      description: "City or locality for delivery zones",
    }),

    defineField({
      name: "country",
      title: "Country",
      type: "string",
      description: "Country for shipping calculations",
      initialValue: "Uganda",
    }),

    defineField({
      name: "deliveryInstructions",
      title: "Delivery Instructions",
      type: "text",
      description:
        'Extra delivery details (e.g., "Blue gate", "Security code: 1234")',
      rows: 2,
    }),
  ],

  preview: {
    select: {
      label: "label",
      address: "address",
      locality: "locality",
      isDefault: "isDefault",
    },
    prepare({ label, address, locality, isDefault }) {
      const labelText = label?.toUpperCase() || "ADDRESS";
      const defaultText = isDefault ? " (Default)" : "";
      const locationText = locality ? ` • ${locality}` : "";

      return {
        title: `${labelText}${defaultText}`,
        subtitle: `${address || "No address"}${locationText}`,
      };
    },
  },
});
