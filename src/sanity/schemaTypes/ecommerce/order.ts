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
          { title: "Pending", value: "pending" },
          { title: "Confirmed", value: "confirmed" },
          { title: "Processing", value: "processing" },
          { title: "Ready", value: "ready" },
          { title: "Shipped", value: "shipped" },
          { title: "Delivered", value: "delivered" },
          { title: "Cancelled", value: "cancelled" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required().error("Order status is required"),
      initialValue: "pending",
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
