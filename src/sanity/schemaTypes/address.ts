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
      title: "Contact Phone for this Address",
      type: "string",
      description: "Phone number for delivery contact at this address",
      validation: (rule) =>
        rule
          .regex(/^[+]?[0-9\s\-\(\)]{7,15}$/)
          .error("Enter a valid phone number"),
    }),

    defineField({
      name: "additionalDetails",
      title: "Additional Delivery Instructions",
      type: "text",
      description:
        'Extra details for delivery (e.g., "Blue gate", "Security code: 1234", "Ask for John")',
      rows: 3,
    }),
    defineField({
      name: "searchedLocation",
      title: "Searched Location",
      type: "string",
      description:
        'What the customer searched for in Google Maps (e.g., "Shell Bukoto", "Garden City Mall")',
      validation: (rule) =>
        rule.required().error("Searched location is required"),
      readOnly: true,
    }),

    defineField({
      name: "formattedAddress",
      title: "Complete Address",
      type: "text",
      description: "Full formatted address from Google Maps API",
      validation: (rule) => rule.required().error("Address is required"),
      readOnly: true,
      rows: 2,
    }),

    defineField({
      name: "coordinates",
      title: "GPS Coordinates",
      type: "object",
      description: "Precise GPS coordinates for delivery navigation",
      validation: (rule) =>
        rule.required().error("GPS coordinates are required"),
      fields: [
        defineField({
          name: "lat",
          title: "Latitude",
          type: "number",
          validation: (rule) => rule.required().min(-90).max(90),
        }),
        defineField({
          name: "lng",
          title: "Longitude",
          type: "number",
          validation: (rule) => rule.required().min(-180).max(180),
        }),
      ],
    }),

    defineField({
      name: "placeId",
      title: "Google Place ID",
      type: "string",
      description: "Unique Google Places API identifier for this location",
      readOnly: true,
    }),

    defineField({
      name: "country",
      title: "Country",
      type: "string",
      description: "Country for shipping calculations",
      readOnly: true,
    }),

    defineField({
      name: "locality",
      title: "City/Area",
      type: "string",
      description: "City or locality for delivery zones",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      label: "label",
      searchedLocation: "searchedLocation",
      formattedAddress: "formattedAddress",
      isDefault: "isDefault",
    },
    prepare({ label, searchedLocation, formattedAddress, isDefault }) {
      const title = `${label?.toUpperCase() || "Address"} - ${searchedLocation || "No location"}`;
      const subtitle = formattedAddress || "No address";
      return {
        title: isDefault ? `${title} (Default)` : title,
        subtitle,
      };
    },
  },
});
