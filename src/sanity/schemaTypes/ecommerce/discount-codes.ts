import { defineType, defineField, defineArrayMember } from "sanity";

export const discountCodes = defineType({
  name: "discountCodes",
  title: "Discount Codes",
  type: "document",
  description:
    "Promotional discount codes for order-level discounts at checkout",
  fields: [
    defineField({
      name: "code",
      title: "Discount Code",
      type: "string",
      description:
        'Unique discount code (e.g., "SUMMER20", "NEWCUSTOMER", "BACK2SCHOOL")',
      validation: (rule) =>
        rule
          .required()
          .min(3)
          .max(50)
          .regex(/^[A-Z0-9]+$/)
          .error(
            "Code must be 3-50 characters, uppercase letters and numbers only"
          ),
    }),

    defineField({
      name: "title",
      title: "Campaign Title",
      type: "string",
      description:
        'Display name for the campaign (e.g., "Summer Sale 2025", "New Customer Welcome")',
      validation: (rule) =>
        rule
          .required()
          .min(3)
          .max(100)
          .error("Campaign title is required (3-100 characters)"),
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "text",
      description: "Internal campaign notes and details",
      rows: 3,
    }),

    defineField({
      name: "type",
      title: "Discount Type",
      type: "string",
      description: "Type of discount",
      options: {
        list: [
          { title: "Percentage", value: "percentage" },
          { title: "Fixed Amount", value: "fixed_amount" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required().error("Discount type is required"),
    }),

    defineField({
      name: "value",
      title: "Discount Value",
      type: "number",
      description: "Discount amount (percentage or UGX amount)",
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .custom((value, context) => {
            const type = context.document?.type;
            if (type === "percentage" && (value as number) > 100) {
              return "Percentage discount cannot exceed 100%";
            }
            if (type === "fixed_amount" && (value as number) > 10000000) {
              return "Fixed amount discount seems too high";
            }
            return true;
          }),
    }),

    defineField({
      name: "maxUses",
      title: "Maximum Total Uses",
      type: "number",
      description:
        "Total times this code can be used (leave empty for unlimited)",
      validation: (rule) =>
        rule.min(1).error("Maximum uses must be at least 1"),
    }),

    defineField({
      name: "maxUsesPerUser",
      title: "Maximum Uses Per User",
      type: "number",
      description: "How many times each customer can use this code",
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .error("Maximum uses per user must be at least 1"),
      initialValue: 1,
    }),

    defineField({
      name: "currentUses",
      title: "Current Uses",
      type: "number",
      description: "How many times this code has been used so far",
      validation: (rule) =>
        rule.required().min(0).error("Current uses cannot be negative"),
      initialValue: 0,
      readOnly: true,
    }),

    defineField({
      name: "minimumOrderAmount",
      title: "Minimum Order Amount (UGX)",
      type: "number",
      description: "Minimum order value required to use this code",
      validation: (rule) =>
        rule.min(0).error("Minimum order amount cannot be negative"),
      initialValue: 0,
    }),

    defineField({
      name: "startDate",
      title: "Start Date",
      type: "datetime",
      description: "When this discount code becomes active",
      validation: (rule) => rule.required().error("Start date is required"),
    }),

    defineField({
      name: "endDate",
      title: "End Date",
      type: "datetime",
      description: "When this discount code expires",
      validation: (rule) =>
        rule.required().custom((endDate, context) => {
          const startDate = context.document?.startDate;
          if (
            startDate &&
            endDate &&
            new Date(endDate as string) <= new Date(startDate as string)
          ) {
            return "End date must be after start date";
          }
          return true;
        }),
    }),

    defineField({
      name: "isActive",
      title: "Code Active",
      type: "boolean",
      description: "Manual enable/disable toggle for this discount code",
      initialValue: true,
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "usedBy",
      title: "Usage Records",
      type: "array",
      description: "Track which users have used this code and when",
      of: [
        defineArrayMember({
          type: "object",
          title: "Usage Record",
          fields: [
            defineField({
              name: "user",
              title: "User",
              type: "reference",
              description: "User who used this code",
              to: [{ type: "user" }],
              validation: (rule) =>
                rule.required().error("User reference is required"),
            }),
            defineField({
              name: "usedAt",
              title: "Used At",
              type: "datetime",
              description: "When the code was used",
              validation: (rule) =>
                rule.required().error("Usage timestamp is required"),
            }),
            defineField({
              name: "order",
              title: "Order",
              type: "reference",
              description: "Order where this code was used",
              to: [{ type: "order" }],
              validation: (rule) =>
                rule.required().error("Order reference is required"),
            }),
            defineField({
              name: "orderNumber",
              title: "Order Number",
              type: "string",
              description: "Order number for quick reference",
              validation: (rule) =>
                rule.required().error("Order number is required"),
            }),
            defineField({
              name: "discountAmount",
              title: "Discount Amount (UGX)",
              type: "number",
              description: "Actual discount amount applied",
              validation: (rule) =>
                rule
                  .required()
                  .min(0)
                  .error("Discount amount must be positive"),
            }),
            defineField({
              name: "orderTotal",
              title: "Order Total (UGX)",
              type: "number",
              description: "Total order amount before discount",
              validation: (rule) =>
                rule.required().min(0).error("Order total must be positive"),
            }),
          ],
          preview: {
            select: {
              userEmail: "user.email",
              userName: "user.firstName",
              orderNumber: "orderNumber",
              discountAmount: "discountAmount",
              usedAt: "usedAt",
            },
            prepare({
              userEmail,
              userName,
              orderNumber,
              discountAmount,
              usedAt,
            }) {
              const userDisplay = userName || userEmail || "Unknown User";
              const date = usedAt
                ? new Date(usedAt).toLocaleDateString()
                : "No date";
              const discount = discountAmount
                ? `${discountAmount.toLocaleString()} UGX saved`
                : "No amount";

              return {
                title: `${userDisplay} - ${orderNumber}`,
                subtitle: `${date} • ${discount}`,
              };
            },
          },
        }),
      ],
    }),

    defineField({
      name: "firstTimeCustomersOnly",
      title: "First-Time Customers Only",
      type: "boolean",
      description:
        "Restrict this code to customers who have never placed an order",
      initialValue: false,
    }),

    defineField({
      name: "excludedProducts",
      title: "Excluded Products",
      type: "array",
      description: "Products that are NOT eligible for this discount",
      of: [
        {
          type: "reference",
          to: [{ type: "product" }],
        },
      ],
    }),

    defineField({
      name: "excludedCourses",
      title: "Excluded Courses",
      type: "array",
      description: "Courses that are NOT eligible for this discount",
      of: [
        {
          type: "reference",
          to: [{ type: "course" }],
        },
      ],
    }),

    defineField({
      name: "totalDiscountGiven",
      title: "Total Discount Given (UGX)",
      type: "number",
      description: "Total amount discounted through this code",
      validation: (rule) =>
        rule.required().min(0).error("Total discount given cannot be negative"),
      initialValue: 0,
      readOnly: true,
    }),

    defineField({
      name: "totalOrderValue",
      title: "Total Order Value (UGX)",
      type: "number",
      description: "Total value of all orders using this code",
      validation: (rule) =>
        rule.required().min(0).error("Total order value cannot be negative"),
      initialValue: 0,
      readOnly: true,
    }),

    defineField({
      name: "notes",
      title: "Internal Notes",
      type: "text",
      description: "Internal admin notes about this discount code",
      rows: 3,
    }),

    defineField({
      name: "createdBy",
      title: "Created By",
      type: "string",
      description: "Staff member who created this discount code",
      validation: (rule) =>
        rule.required().error("Created by field is required"),
    }),

    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      description: "When this discount code was created",
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
  ],

  preview: {
    select: {
      code: "code",
      title: "title",
      type: "type",
      value: "value",
      isActive: "isActive",
      currentUses: "currentUses",
      maxUses: "maxUses",
      startDate: "startDate",
      endDate: "endDate",
      firstTimeCustomersOnly: "firstTimeCustomersOnly",
      totalDiscountGiven: "totalDiscountGiven",
    },
    prepare({
      code,
      title,
      type,
      value,
      isActive,
      currentUses,
      maxUses,
      startDate,
      endDate,
      firstTimeCustomersOnly,
      totalDiscountGiven,
    }) {
      const discountDisplay =
        type === "percentage"
          ? `${value}% OFF`
          : `${value?.toLocaleString()} UGX OFF`;

      const statusInfo = !isActive ? " (Inactive)" : "";

      const usageInfo = maxUses
        ? ` • ${currentUses}/${maxUses} uses`
        : ` • ${currentUses} uses`;

      const now = new Date();
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      let validityInfo = "";
      if (start && now < start) {
        validityInfo = " (Not Started)";
      } else if (end && now > end) {
        validityInfo = " (Expired)";
      }

      const customerTypeInfo = firstTimeCustomersOnly
        ? " • New customers only"
        : "";

      const totalSaved = totalDiscountGiven
        ? ` • ${totalDiscountGiven.toLocaleString()} UGX saved`
        : "";

      return {
        title: `${code} - ${discountDisplay}${statusInfo}${validityInfo}`,
        subtitle: `${title}${usageInfo}${customerTypeInfo}${totalSaved}`,
      };
    },
  },

  orderings: [
    {
      title: "Recently Created",
      name: "recentlyCreated",
      by: [{ field: "createdAt", direction: "desc" }],
    },
    {
      title: "Code A-Z",
      name: "codeAsc",
      by: [{ field: "code", direction: "asc" }],
    },
    {
      title: "Most Used",
      name: "mostUsed",
      by: [{ field: "currentUses", direction: "desc" }],
    },
    {
      title: "Highest Discount",
      name: "highestDiscount",
      by: [{ field: "totalDiscountGiven", direction: "desc" }],
    },
    {
      title: "End Date",
      name: "endDate",
      by: [{ field: "endDate", direction: "asc" }],
    },
    {
      title: "Active Codes",
      name: "activeCodes",
      by: [
        { field: "isActive", direction: "desc" },
        { field: "endDate", direction: "asc" },
      ],
    },
  ],
});
