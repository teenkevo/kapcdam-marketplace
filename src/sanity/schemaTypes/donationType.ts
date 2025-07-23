import { defineType, defineField } from "sanity";

export const donation = defineType({
  name: "donation",
  title: "Donation",
  type: "document",
  description: "Individual donations made to KAPCDAM",
  fields: [
    defineField({
      name: "donationId",
      title: "Donation ID",
      type: "string",
      description: "Unique donation identifier (e.g., DON-2025-001)",
      validation: (rule) => rule.required().error("Donation ID is required"),
      readOnly: true,
    }),

    defineField({
      name: "amount",
      title: "Donation Amount (USD)",
      type: "number",
      description: "Donation amount in US Dollars",
      validation: (rule) =>
        rule.required().min(1).error("Minimum donation is $1 USD"),
      readOnly: true,
    }),

    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      description: "Donation currency",
      validation: (rule) => rule.required().error("Currency is required"),
      initialValue: "USD",
      readOnly: true,
    }),

    defineField({
      name: "type",
      title: "Donation Type",
      type: "string",
      description: "Type of donation",
      options: {
        list: [
          { title: "One-time", value: "one_time" },
          { title: "Monthly", value: "monthly" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required().error("Donation type is required"),
      readOnly: true,
    }),

    defineField({
      name: "isBankTransfer",
      title: "Is this a bank transfer?",
      type: "string",
      description: "Is this a bank transfer? If true, the payment method will be bank transfer",
      options: {
        list: [
          { title: "Yes", value: "true" },
          { title: "No", value: "false" },
        ],
      },
      readOnly: true,
    }),

    defineField({
      name: "donorInfo",
      title: "Donor Information",
      type: "object",
      description: "Details about the person making the donation",
      readOnly: true,
      fields: [
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
          name: "email",
          title: "Email Address",
          type: "string",
          validation: (rule) =>
            rule.required().email().error("Valid email address is required"),
        }),
        defineField({
          name: "phone",
          title: "Phone Number",
          type: "string",
          description: "Contact phone number",
          validation: (rule) =>
            rule
              .regex(/^[+]?[0-9\s\-\(\)]{7,15}$/)
              .error("Enter a valid phone number"),
        }),
      ],
      validation: (rule) =>
        rule.required().error("Donor information is required"),
    }),

    defineField({
      name: "paymentStatus",
      title: "Payment Status",
      type: "string",
      description: "Current payment status",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Completed", value: "completed" },
          { title: "Failed", value: "failed" },
          { title: "Refunded", value: "refunded" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required().error("Payment status is required"),
      readOnly: ({ document }) => document?.isBankTransfer === "true",
      initialValue: "pending",
    }),

    defineField({
      name: "transactionId",
      title: "Transaction ID",
      type: "string",
      description: "PESAPAL transaction reference",
      readOnly: true,
    }),

    defineField({
      name: "orderTrackingId",
      title: "Order Tracking ID",
      type: "string",
      description: "PESAPAL order tracking ID",
      readOnly: true,
    }),

    defineField({
      name: "confirmationCode",
      title: "Confirmation Code",
      type: "string",
      description: "Payment confirmation code",
      readOnly: true,
    }),

    defineField({
      name: "donatedAt",
      title: "Donation Date",
      type: "datetime",
      description: "When the donation was made",
      validation: (rule) => rule.required().error("Donation date is required"),
      initialValue: () => new Date().toISOString(),
    }),

    defineField({
      name: "paidAt",
      title: "Payment Completed At",
      type: "datetime",
      description: "When payment was completed",
      hidden: ({ document }) => document?.paymentStatus !== "completed",
      readOnly: true,
    }),

    defineField({
      name: "recurringDetails",
      title: "Recurring Donation Details",
      type: "object",
      description: "Details for monthly donations",
      hidden: ({ document }) => document?.type !== "monthly",
      fields: [
        defineField({
          name: "startDate",
          title: "Start Date",
          type: "datetime",
          description: "When monthly donations begin",
          validation: (rule) =>
            rule.custom((startDate, context) => {
              const parent = context.document;
              if (parent?.type === "monthly" && !startDate) {
                return "Start date is required for monthly donations";
              }
              return true;
            }),
        }),
        defineField({
          name: "endDate",
          title: "End Date (Optional)",
          type: "datetime",
          description:
            "When monthly donations end (leave empty for indefinite)",
        }),
        defineField({
          name: "frequency",
          title: "Frequency",
          type: "string",
          description: "Donation frequency",
          initialValue: "MONTHLY",
          readOnly: true,
        }),
        defineField({
          name: "isActive",
          title: "Recurring Active",
          type: "boolean",
          description: "Is this recurring donation still active?",
          initialValue: true,
          readOnly: true,
        }),
        defineField({
          name: "totalDonations",
          title: "Total Donations Made",
          type: "number",
          description: "Number of successful monthly donations",
          validation: (rule) =>
            rule.required().min(0).error("Total donations cannot be negative"),
          initialValue: 0,
          readOnly: true,
        }),
        defineField({
          name: "totalAmount",
          title: "Total Amount Donated (USD)",
          type: "number",
          description: "Total amount donated through this recurring plan",
          validation: (rule) =>
            rule.required().min(0).error("Total amount cannot be negative"),
          initialValue: 0,
          readOnly: true,
        }),
        defineField({
          name: "lastDonationDate",
          title: "Last Donation Date",
          type: "datetime",
          description: "When the last successful donation was made",
          readOnly: true,
        }),
        defineField({
          name: "nextDonationDate",
          title: "Next Donation Date",
          type: "datetime",
          description: "When the next donation is scheduled",
          readOnly: true,
        }),
        defineField({
          name: "recurringPayments",
          title: "Individual Payments",
          type: "array",
          description: "Track each monthly payment separately",
          of: [
            {
              type: "object",
              title: "Monthly Payment",
              fields: [
                defineField({
                  name: "paymentDate",
                  title: "Payment Date",
                  type: "datetime",
                  description: "When this payment was made",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "amount",
                  title: "Amount (USD)",
                  type: "number",
                  description: "Amount for this payment",
                  validation: (rule) => rule.required().min(0),
                }),
                defineField({
                  name: "orderTrackingId",
                  title: "Order Tracking ID",
                  type: "string",
                  description: "PESAPAL tracking ID for this payment",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "confirmationCode",
                  title: "Confirmation Code",
                  type: "string",
                  description: "PESAPAL confirmation code",
                }),
                defineField({
                  name: "paymentStatus",
                  title: "Payment Status",
                  type: "string",
                  options: {
                    list: [
                      { title: "Pending", value: "pending" },
                      { title: "Completed", value: "completed" },
                      { title: "Failed", value: "failed" },
                    ],
                  },
                  validation: (rule) => rule.required(),
                  initialValue: "pending",
                }),
                defineField({
                  name: "paymentMethod",
                  title: "Payment Method",
                  type: "string",
                  description:
                    "How this payment was made (e.g., Visa, Mobile Money)",
                }),
                defineField({
                  name: "isInitialPayment",
                  title: "Initial Payment",
                  type: "boolean",
                  description:
                    "Was this the first payment that set up the subscription?",
                  initialValue: false,
                }),
              ],
              preview: {
                select: {
                  paymentDate: "paymentDate",
                  amount: "amount",
                  paymentStatus: "paymentStatus",
                  isInitialPayment: "isInitialPayment",
                },
                prepare({
                  paymentDate,
                  amount,
                  paymentStatus,
                  isInitialPayment,
                }) {
                  const date = paymentDate
                    ? new Date(paymentDate).toLocaleDateString()
                    : "No date";
                  const amountFormatted = amount
                    ? `${amount.toLocaleString()} USD`
                    : "No amount";
                  const statusIcon =
                    paymentStatus === "completed" ? "✅" : "⏳";
                  const initialBadge = isInitialPayment ? " (Initial)" : "";

                  return {
                    title: `${date} - ${amountFormatted}${initialBadge}`,
                    subtitle: `${statusIcon} ${paymentStatus}`,
                  };
                },
              },
            },
          ],
          readOnly: true,
        }),
      ],
    }),

    defineField({
      name: "message",
      title: "Donor Message",
      type: "text",
      description: "Optional message from the donor",
      rows: 3,
      readOnly: true,
    }),

    defineField({
      name: "thankYouSent",
      title: "Thank You Sent",
      type: "boolean",
      description: "Has a thank you message been sent?",
      initialValue: false,
    }),

    defineField({
      name: "notes",
      title: "Internal Notes",
      type: "text",
      description: "Internal admin notes about this donation",
      rows: 3,
    }),

    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      description: "When this record was created",
      validation: (rule) =>
        rule.required().error("Created at timestamp is required"),
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),

    defineField({
      name: "updatedAt",
      title: "Updated At",
      type: "datetime",
      description: "Last modification timestamp",
      validation: (rule) =>
        rule.required().error("Updated at timestamp is required"),
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
  ],

  preview: {
    select: {
      donationId: "donationId",
      amount: "amount",
      type: "type",
      firstName: "donorInfo.firstName",
      lastName: "donorInfo.lastName",
      email: "donorInfo.email",
      paymentStatus: "paymentStatus",
      donatedAt: "donatedAt",
    },
    prepare({
      donationId,
      amount,
      type,
      firstName,
      lastName,
      email,
      paymentStatus,
      donatedAt,
    }) {
      const donorName =
        `${firstName || ""} ${lastName || ""}`.trim() ||
        email ||
        "Unknown Donor";

      const amountFormatted = amount
        ? `${amount.toLocaleString()} USD`
        : "No amount";

      const typeDisplay = type === "monthly" ? "Monthly" : "One-time";

      const date = donatedAt ? new Date(donatedAt).toLocaleDateString() : "";

      return {
        title: `${donationId || "New Donation"} - ${amountFormatted} (${typeDisplay})`,
        subtitle: `${paymentStatus} - ${donorName} • ${date}`,
      };
    },
  },

  orderings: [
    {
      title: "Recent Donations",
      name: "recentDonations",
      by: [{ field: "donatedAt", direction: "desc" }],
    },
    {
      title: "Amount: High to Low",
      name: "amountDesc",
      by: [{ field: "amount", direction: "desc" }],
    },
    {
      title: "Payment Status",
      name: "paymentStatus",
      by: [{ field: "paymentStatus", direction: "asc" }],
    },
    {
      title: "Donation Type",
      name: "donationType",
      by: [{ field: "type", direction: "asc" }],
    },
    {
      title: "Donor Name",
      name: "donorName",
      by: [{ field: "donorInfo.firstName", direction: "asc" }],
    },
    {
      title: "Monthly Donations",
      name: "monthlyDonations",
      by: [{ field: "donatedAt", direction: "desc" }],
    },
  ],
});
