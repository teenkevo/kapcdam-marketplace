import { defineType, defineField } from "sanity";

export const deliveryZone = defineType({
  name: "deliveryZone",
  title: "Delivery Zone",
  type: "document",
  description: "Delivery zones with pricing for different cities and regions",
  fields: [
    defineField({
      name: "zoneName",
      title: "Zone Name",
      type: "string",
      description:
        "Name of the delivery zone (e.g., 'Central Kampala', 'Greater Kampala Area')",
      validation: (rule) => rule.required().error("Zone name is required"),
    }),

    defineField({
      name: "cities",
      title: "Cities",
      type: "array",
      of: [{ type: "string" }],
      description: "List of cities/areas covered by this delivery zone",
      validation: (rule) =>
        rule.required().min(1).error("At least one city is required"),
    }),

    defineField({
      name: "country",
      title: "Country",
      type: "string",
      description: "Country where this delivery zone operates",
      initialValue: "Uganda",
      validation: (rule) => rule.required().error("Country is required"),
    }),

    defineField({
      name: "fee",
      title: "Delivery Fee",
      type: "number",
      description: "Delivery fee for this zone in UGX",
      validation: (rule) =>
        rule.required().min(0).error("Delivery fee must be 0 or greater"),
    }),

    defineField({
      name: "isActive",
      title: "Active",
      type: "boolean",
      description: "Whether this delivery zone is currently active",
      initialValue: true,
    }),

    defineField({
      name: "estimatedDeliveryTime",
      title: "Estimated Delivery Time",
      type: "string",
      description: "Estimated delivery time (e.g., '1-2 days', '2-3 hours')",
      validation: (rule) =>
        rule.required().error("Estimated delivery time is required"),
    }),
  ],

  preview: {
    select: {
      title: "zoneName",
      subtitle: "fee",
      cities: "cities",
    },
    prepare(selection) {
      const { title, subtitle, cities } = selection;
      const cityCount = cities?.length || 0;
      return {
        title: title,
        subtitle: `UGX ${subtitle?.toLocaleString()} • ${cityCount} cities`,
      };
    },
  },

  orderings: [
    {
      title: "Zone Name",
      name: "zoneNameAsc",
      by: [{ field: "zoneName", direction: "asc" }],
    },
    {
      title: "Delivery Fee",
      name: "feeAsc",
      by: [{ field: "fee", direction: "asc" }],
    },
  ],
});
