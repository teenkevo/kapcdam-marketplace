import { defineType, defineField } from "sanity";

export const reviews = defineType({
  name: "reviews",
  title: "Reviews & Ratings",
  type: "document",
  description:
    "Customer reviews and ratings for products and courses with verified purchase requirements",
  fields: [
    defineField({
      name: "user",
      title: "Customer",
      type: "reference",
      description: "Customer who wrote this review",
      to: [{ type: "user" }],
      validation: (rule) =>
        rule.required().error("Customer reference is required"),
    }),

    defineField({
      name: "itemType",
      title: "Item Type",
      type: "string",
      description: "Type of item being reviewed",
      options: {
        list: [
          { title: "Product", value: "product" },
          { title: "Course", value: "course" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required().error("Item type is required"),
    }),

    defineField({
      name: "product",
      title: "Product",
      type: "reference",
      description: "Product being reviewed",
      to: [{ type: "product" }],
      hidden: ({ document }) => document?.itemType !== "product",
      validation: (rule) =>
        rule.custom((value, context) => {
          const itemType = context.document?.itemType;
          if (itemType === "product" && !value) {
            return "Product reference is required when reviewing a product";
          }
          return true;
        }),
    }),

    defineField({
      name: "course",
      title: "Course",
      type: "reference",
      description: "Course being reviewed",
      to: [{ type: "course" }],
      hidden: ({ document }) => document?.itemType !== "course",
      validation: (rule) =>
        rule.custom((value, context) => {
          const itemType = context.document?.itemType;
          if (itemType === "course" && !value) {
            return "Course reference is required when reviewing a course";
          }
          return true;
        }),
    }),

    defineField({
      name: "rating",
      title: "Rating",
      type: "number",
      description: "Star rating (1-5 stars)",
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .max(5)
          .integer()
          .error("Rating must be between 1 and 5 stars"),
    }),

    defineField({
      name: "title",
      title: "Review Title",
      type: "string",
      description: "Optional headline for the review",
      validation: (rule) =>
        rule.max(100).error("Review title should be under 100 characters"),
    }),

    defineField({
      name: "reviewText",
      title: "Review Text",
      type: "text",
      description: "Optional detailed review text",
      rows: 4,
      validation: (rule) =>
        rule.max(1000).error("Review text should be under 1000 characters"),
    }),

    defineField({
      name: "isVerifiedPurchase",
      title: "Verified Purchase",
      type: "boolean",
      description: "Is this review from a verified purchase?",
      validation: (rule) => rule.required(),
      initialValue: false,
    }),

    defineField({
      name: "order",
      title: "Order",
      type: "reference",
      description: "Order that proves the purchase (optional - required only for verification)",
      to: [{ type: "order" }],
      validation: (rule) =>
        rule.custom((value, context) => {
          const isVerifiedPurchase = context.document?.isVerifiedPurchase;
          if (isVerifiedPurchase && !value) {
            return "Order reference is required for verified purchases";
          }
          return true;
        }),
    }),

    defineField({
      name: "status",
      title: "Review Status",
      type: "string",
      description: "Current moderation status",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Approved", value: "approved" },
          { title: "Rejected", value: "rejected" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required().error("Review status is required"),
      initialValue: "pending",
    }),
    defineField({
      name: "moderationNote",
      title: "Moderation Note",
      type: "text",
      description: "Note explaining why review was rejected (if applicable)",
      rows: 2,
      hidden: ({ document }) => document?.status !== "rejected",
    }),

    defineField({
      name: "helpfulCount",
      title: "Helpful Count",
      type: "number",
      description: "Number of users who found this review helpful",
      validation: (rule) =>
        rule.required().min(0).error("Helpful count cannot be negative"),
      initialValue: 0,
    }),

    defineField({
      name: "notHelpfulCount",
      title: "Not Helpful Count",
      type: "number",
      description: "Number of users who found this review not helpful",
      validation: (rule) =>
        rule.required().min(0).error("Not helpful count cannot be negative"),
      initialValue: 0,
    }),

    defineField({
      name: "voteRecords",
      title: "Vote Records",
      type: "array",
      description: "Track who voted on this review to prevent duplicate voting",
      of: [
        {
          type: "object",
          title: "Vote Record",
          fields: [
            defineField({
              name: "user",
              title: "User",
              type: "reference",
              description: "User who voted",
              to: [{ type: "user" }],
              validation: (rule) =>
                rule.required().error("User reference is required"),
            }),
            defineField({
              name: "voteType",
              title: "Vote Type",
              type: "string",
              options: {
                list: [
                  { title: "Helpful", value: "helpful" },
                  { title: "Not Helpful", value: "not_helpful" },
                ],
                layout: "radio",
              },
              validation: (rule) =>
                rule.required().error("Vote type is required"),
            }),
            defineField({
              name: "votedAt",
              title: "Voted At",
              type: "datetime",
              description: "When the vote was cast",
              validation: (rule) =>
                rule.required().error("Vote timestamp is required"),
              initialValue: () => new Date().toISOString(),
            }),
          ],
          preview: {
            select: {
              userEmail: "user.email",
              voteType: "voteType",
              votedAt: "votedAt",
            },
            prepare({ userEmail, voteType, votedAt }) {
              const date = votedAt
                ? new Date(votedAt).toLocaleDateString()
                : "No date";
              return {
                title: `${userEmail || "Unknown user"} - ${voteType}`,
                subtitle: date,
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
      description: "When this review was originally posted",
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
      name: "approvedAt",
      title: "Approved At",
      type: "datetime",
      description: "When this review was approved",
      hidden: ({ document }) => document?.status !== "approved",
    }),

    defineField({
      name: "isActive",
      title: "Review Active",
      type: "boolean",
      description: "Is this review visible to customers?",
      initialValue: true,
    }),

    defineField({
      name: "adminNotes",
      title: "Internal Notes",
      type: "text",
      description: "Internal admin notes about this review",
      rows: 2,
    }),
  ],

  preview: {
    select: {
      userEmail: "user.email",
      userName: "user.firstName",
      rating: "rating",
      title: "title",
      reviewText: "reviewText",
      itemType: "itemType",
      productTitle: "product.title",
      courseTitle: "course.title",
      status: "status",
      isVerifiedPurchase: "isVerifiedPurchase",
      helpfulCount: "helpfulCount",
      notHelpfulCount: "notHelpfulCount",
      createdAt: "createdAt",
    },
    prepare({
      userEmail,
      userName,
      rating,
      title,
      reviewText,
      itemType,
      productTitle,
      courseTitle,
      status,
      isVerifiedPurchase,
      helpfulCount,
      notHelpfulCount,
      createdAt,
    }) {
      const userDisplay = userName || userEmail || "Unknown User";
      const itemTitle = itemType === "product" ? productTitle : courseTitle;
      const itemDisplay = itemTitle || "Unknown Item";

      const ratingDisplay = `${rating}/5 stars`;

      const statusInfo =
        status === "pending"
          ? " (Pending)"
          : status === "rejected"
            ? " (Rejected)"
            : "";

      const verifiedInfo = isVerifiedPurchase ? " (Verified)" : "";

      const voteInfo =
        helpfulCount || notHelpfulCount
          ? ` • ${helpfulCount} helpful, ${notHelpfulCount} not helpful`
          : "";

      const date = createdAt ? new Date(createdAt).toLocaleDateString() : "";

      const reviewTitle =
        title || reviewText?.substring(0, 50) || "No review text";
      const titleDisplay =
        reviewTitle.length > 50 ? `${reviewTitle}...` : reviewTitle;

      return {
        title: `${ratingDisplay} ${userDisplay} - ${itemDisplay}${statusInfo}${verifiedInfo}`,
        subtitle: `${titleDisplay} • ${date}${voteInfo}`,
      };
    },
  },

  orderings: [
    {
      title: "Recent Reviews",
      name: "recentReviews",
      by: [{ field: "createdAt", direction: "desc" }],
    },
    {
      title: "Rating: High to Low",
      name: "ratingDesc",
      by: [{ field: "rating", direction: "desc" }],
    },
    {
      title: "Rating: Low to High",
      name: "ratingAsc",
      by: [{ field: "rating", direction: "asc" }],
    },
    {
      title: "Most Helpful",
      name: "mostHelpful",
      by: [{ field: "helpfulCount", direction: "desc" }],
    },
    {
      title: "Pending Reviews",
      name: "pendingReviews",
      by: [{ field: "createdAt", direction: "desc" }],
    },
    {
      title: "Verified Purchases",
      name: "verifiedPurchases",
      by: [{ field: "isVerifiedPurchase", direction: "desc" }],
    },
    {
      title: "Customer Name",
      name: "customerName",
      by: [{ field: "user.firstName", direction: "asc" }],
    },
  ],
});
