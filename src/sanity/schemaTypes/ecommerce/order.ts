import { defineType, defineField } from "sanity";

export const order = defineType({
  name: "order",
  title: "Order",
  type: "document",

  description:
    "Financial container for customer orders including products and courses",
  fields: [
    defineField({
      name: "orderNumber",
      title: "Order Number",
      type: "string",
      description: "Unique order identifier (e.g., KAPC-2025-001)",
      validation: (rule) => rule.required().error("Order number is required"),
      readOnly: true,
    }),

    defineField({
      name: "orderDate",
      title: "Order Date",
      type: "datetime",
      description: "When the order was placed",
      validation: (rule) => rule.required().error("Order date is required"),
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),

    defineField({
      name: "customer",
      title: "Customer",
      type: "reference",
      description: "Reference to customer user",
      to: [{ type: "user" }],
      validation: (rule) =>
        rule.required().error("Customer reference is required"),
      readOnly: true,
    }),
    defineField({
      name: "orderItems",
      title: "Order Items",
      type: "array",
      description: "Items in this order",
      of: [{ type: "orderItem" }],
      readOnly: true,
    }),
    defineField({
      name: "subtotal",
      title: "Subtotal (UGX)",
      type: "number",
      description: "Sum of all line totals (after item discounts)",
      validation: (rule) =>
        rule.required().min(0).error("Subtotal must be a positive number"),
    }),

    defineField({
      name: "tax",
      title: "Tax Amount (UGX)",
      type: "number",
      description: "Tax amount (if applicable)",
      validation: (rule) => rule.min(0).error("Tax amount cannot be negative"),
      initialValue: 0,
    }),

    defineField({
      name: "shippingCost",
      title: "Shipping Cost (UGX)",
      type: "number",
      description: "Delivery/shipping fees",
      validation: (rule) =>
        rule.min(0).error("Shipping cost cannot be negative"),
      initialValue: 0,
    }),

    defineField({
      name: "totalItemDiscounts",
      title: "Total Item Discounts (UGX)",
      type: "number",
      description: "Sum of all item-level discounts applied",
      validation: (rule) =>
        rule.min(0).error("Total item discounts cannot be negative"),
      initialValue: 0,
    }),

    defineField({
      name: "orderLevelDiscount",
      title: "Order-Level Discount",
      type: "object",
      description:
        "Applied coupon discount information (e.g., 'TEST20 20% OFF')",
      fields: [
        defineField({
          name: "couponApplied",
          title: "Coupon Applied",
          type: "string",
          description: "Coupon display text (e.g., 'TEST20 20% OFF')",
          validation: (rule) =>
            rule.required().error("Coupon applied text is required"),
        }),
        defineField({
          name: "discountAmount",
          title: "Discount Amount (UGX)",
          type: "number",
          description: "Actual discount amount applied at order level",
          validation: (rule) =>
            rule.required().min(0).error("Discount amount cannot be negative"),
        }),
      ],
    }),

    defineField({
      name: "total",
      title: "Total Amount (UGX)",
      type: "number",
      description: "Final amount to pay",
      validation: (rule) =>
        rule.required().min(0).error("Total amount must be a positive number"),
      readOnly: true,
    }),

    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      description: "Order currency",
      validation: (rule) => rule.required().error("Currency is required"),
      initialValue: "UGX",
      readOnly: true,
    }),

    defineField({
      name: "paymentStatus",
      title: "Payment Status",
      type: "string",
      description: "Current payment status",
      options: {
        list: [
          { title: "Not Initiated", value: "not_initiated" },
          { title: "Pending", value: "pending" },
          { title: "Paid", value: "paid" },
          { title: "Failed", value: "failed" },
          { title: "Refunded", value: "refunded" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required().error("Payment status is required"),
      initialValue: "not_initiated",
    }),

    defineField({
      name: "paymentMethod",
      title: "Payment Method",
      type: "string",
      description: "How the customer chose to pay",
      options: {
        list: [
          { title: "Pesapal", value: "pesapal" },
          { title: "Cash on Delivery", value: "cod" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required().error("Payment method is required"),
      readOnly: true,
    }),

    defineField({
      name: "transactionId",
      title: "Transaction ID",
      type: "string",
      description: "Payment gateway transaction reference",
      readOnly: true,
    }),

    defineField({
      name: "paidAt",
      title: "Paid At",
      type: "datetime",
      description: "When payment was completed",
      hidden: ({ document }) => document?.paymentStatus !== "paid",
      readOnly: true,
    }),

    defineField({
      name: "status",
      title: "Order Status",
      type: "string",
      description: "Current order status",
      options: {
        list: [
          { title: "Pending Payment", value: "PENDING_PAYMENT" },
          { title: "Failed Payment", value: "FAILED_PAYMENT" },
          { title: "Processing", value: "PROCESSING" },
          { title: "Ready for Delivery", value: "READY_FOR_DELIVERY" },
          { title: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
          { title: "Delivered", value: "DELIVERED" },
          { title: "Cancelled by User", value: "CANCELLED_BY_USER" },
          { title: "Cancelled by Admin", value: "CANCELLED_BY_ADMIN" },
          { title: "Refund Pending", value: "REFUND_PENDING" },
          { title: "Refunded", value: "REFUNDED" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required().error("Order status is required"),
      initialValue: "PENDING_PAYMENT",
    }),

    defineField({
      name: "shippingAddress",
      title: "Shipping Address",
      type: "reference",
      description: "Reference to customer delivery address",
      to: [{ type: "address" }],
      validation: (rule) =>
        rule.required().error("Shipping address is required"),
      readOnly: true,
    }),

    defineField({
      name: "deliveryMethod",
      title: "Delivery Method",
      type: "string",
      description: "How the order will be delivered",
      options: {
        list: [
          { title: "Pickup", value: "pickup" },
          { title: "Local Delivery", value: "local_delivery" },
        ],
        layout: "dropdown",
      },
      validation: (rule) =>
        rule.required().error("Delivery method is required"),
      readOnly: true,
    }),

    defineField({
      name: "estimatedDelivery",
      title: "Estimated Delivery Date",
      type: "datetime",
      description: "When the order is expected to be delivered",
    }),

    defineField({
      name: "deliveredAt",
      title: "Delivered At",
      type: "datetime",
      description: "When the order was actually delivered",
      hidden: ({ document }) => document?.status !== "delivered",
    }),
    defineField({
      name: "notes",
      title: "Internal Notes",
      type: "text",
      description: "Internal admin notes about this order",
      rows: 3,
    }),

    // New fields for enhanced order state machine
    defineField({
      name: "confirmationCode",
      title: "Payment Confirmation Code",
      type: "string",
      description: "Pesapal confirmation code required for refunds",
      hidden: ({ document }) => document?.paymentMethod !== "pesapal" || document?.paymentStatus !== "paid",
      readOnly: true,
    }),

    defineField({
      name: "cancellationReason",
      title: "Cancellation Reason",
      type: "string",
      description: "Why this order was cancelled",
      options: {
        list: [
          { title: "Customer Request", value: "customer_request" },
          { title: "Customer Changed Mind", value: "changed_mind" },
          { title: "Customer Found Better Price", value: "found_better_price" },
          { title: "Customer No Longer Needed", value: "no_longer_needed" },
          { title: "Customer Ordered by Mistake", value: "ordered_by_mistake" },
          { title: "Delivery Taking Too Long", value: "delivery_too_long" },
          { title: "Payment Failed", value: "payment_failed" },
          { title: "Items Unavailable", value: "items_unavailable" },
          { title: "Fraud Suspected", value: "fraud_suspected" },
          { title: "Other Reason", value: "other" },
        ],
        layout: "dropdown",
      },
      hidden: ({ document }) => document?.status !== "cancelled",
    }),

    defineField({
      name: "cancellationNotes",
      title: "Cancellation Notes",
      type: "text",
      description: "Additional details about the cancellation",
      rows: 2,
      hidden: ({ document }) => document?.status !== "cancelled",
    }),

    defineField({
      name: "cancelledAt",
      title: "Cancelled At",
      type: "datetime",
      description: "When the order was cancelled",
      hidden: ({ document }) => document?.status !== "cancelled",
      readOnly: true,
    }),

    defineField({
      name: "refundStatus",
      title: "Refund Status",
      type: "string",
      description: "Current refund processing status",
      options: {
        list: [
          { title: "Not Applicable", value: "not_applicable" },
          { title: "Pending", value: "pending" },
          { title: "Processing", value: "processing" },
          { title: "Completed", value: "completed" },
          { title: "Failed", value: "failed" },
        ],
        layout: "dropdown",
      },
      initialValue: "not_applicable",
      hidden: ({ document }) => 
        document?.paymentMethod !== "pesapal" || 
        (document?.status !== "cancelled" && document?.paymentStatus !== "refunded"),
    }),

    defineField({
      name: "refundAmount",
      title: "Refund Amount (UGX)",
      type: "number",
      description: "Amount being refunded to customer",
      validation: (rule) => rule.min(0).error("Refund amount cannot be negative"),
      hidden: ({ document }) => 
        !document?.refundStatus || 
        document?.refundStatus === "not_applicable",
    }),

    defineField({
      name: "refundInitiatedAt",
      title: "Refund Initiated At",
      type: "datetime",
      description: "When the refund process was started",
      readOnly: true,
      hidden: ({ document }) => 
        !document?.refundStatus || 
        document?.refundStatus === "not_applicable",
    }),


    defineField({
      name: "migrationVersion",
      title: "Migration Version",
      type: "number",
      description: "Track order schema migration state",
      initialValue: 0,
      readOnly: true,
      hidden: true,
    }),

    defineField({
      name: "orderHistory",
      title: "Order History",
      type: "array",
      description: "Track all status changes and admin actions on this order",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "status",
              title: "Status",
              type: "string",
              options: {
                list: [
                  { title: "Pending Payment", value: "PENDING_PAYMENT" },
                  { title: "Failed Payment", value: "FAILED_PAYMENT" },
                  { title: "Processing", value: "PROCESSING" },
                  { title: "Ready for Delivery", value: "READY_FOR_DELIVERY" },
                  { title: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
                  { title: "Delivered", value: "DELIVERED" },
                  { title: "Cancelled by User", value: "CANCELLED_BY_USER" },
                  { title: "Cancelled by Admin", value: "CANCELLED_BY_ADMIN" },
                  { title: "Refund Pending", value: "REFUND_PENDING" },
                  { title: "Refunded", value: "REFUNDED" },
                ],
              },
              validation: (rule) => rule.required().error("Status is required"),
            }),
            defineField({
              name: "timestamp",
              title: "Timestamp",
              type: "datetime",
              validation: (rule) => rule.required().error("Timestamp is required"),
            }),
            defineField({
              name: "adminId",
              title: "Admin ID",
              type: "string",
              description: "ID of the admin who made this change",
            }),
            defineField({
              name: "notes",
              title: "Notes",
              type: "text",
              description: "Additional notes about this status change",
            }),
          ],
          preview: {
            select: {
              status: "status",
              timestamp: "timestamp",
              notes: "notes",
            },
            prepare({ status, timestamp, notes }) {
              const date = new Date(timestamp).toLocaleDateString();
              const title = `${status.toUpperCase()} - ${date}`;
              const subtitle = notes ? notes.substring(0, 60) + "..." : "";
              return {
                title,
                subtitle,
              };
            },
          },
        },
      ],
      options: {
        sortable: false, // Keep chronological order
      },
    }),
  ],

  preview: {
    select: {
      orderNumber: "orderNumber",
      customerEmail: "customer.email",
      customerName: "customer.firstName",
      total: "total",
      paymentStatus: "paymentStatus",
      paymentMethod: "paymentMethod",
      status: "status",
      orderDate: "orderDate",
    },
    prepare({
      orderNumber,
      customerEmail,
      customerName,
      total,
      paymentStatus,
      paymentMethod,
      status,
      orderDate,
    }) {
      const totalFormatted = total
        ? `${total.toLocaleString()} UGX`
        : "No total";
      const date = orderDate ? new Date(orderDate).toLocaleDateString() : "";
      const customerDisplay =
        customerName || customerEmail || "Unknown Customer";

      // Format payment status for display
      const paymentStatusDisplay = paymentStatus
        ? paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)
        : "Pending";

      const orderStatusDisplay = status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : "Pending";

      // Add payment method indicator
      const paymentMethodIcon = paymentMethod === "cod" ? " 💵" : " 💳";
      
      const title = customerName 
        ? `${orderNumber}${paymentMethodIcon} - ${customerName}`
        : `${orderNumber}${paymentMethodIcon}`;

      let subtitle = `${totalFormatted} • ${paymentMethod === "cod" ? "COD" : "Pesapal"}: ${paymentStatusDisplay}`;
      
      if (status && status !== "pending") {
        subtitle += ` • ${orderStatusDisplay}`;
      }

      return {
        title,
        subtitle,
        media: null,
      };
    },
  },

  orderings: [
    {
      title: "Recent Orders",
      name: "recentOrders",
      by: [{ field: "orderDate", direction: "desc" }],
    },
    {
      title: "Order Number",
      name: "orderNumber",
      by: [{ field: "orderNumber", direction: "asc" }],
    },
    {
      title: "Total Amount: High to Low",
      name: "totalDesc",
      by: [{ field: "total", direction: "desc" }],
    },
    {
      title: "Payment Status",
      name: "paymentStatus",
      by: [{ field: "paymentStatus", direction: "asc" }],
    },
    {
      title: "Order Status",
      name: "orderStatus",
      by: [{ field: "status", direction: "asc" }],
    },
  ],
});
