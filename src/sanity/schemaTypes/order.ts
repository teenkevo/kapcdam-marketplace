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
      title: "Order-Level Discount (UGX)",
      type: "number",
      description: "Additional order-wide discount (promo codes)",
      validation: (rule) =>
        rule.min(0).error("Order-level discount cannot be negative"),
      initialValue: 0,
      readOnly: true,
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
          { title: "Pending", value: "pending" },
          { title: "Paid", value: "paid" },
          { title: "Failed", value: "failed" },
          { title: "Refunded", value: "refunded" },
          { title: "Partial Payment", value: "partial" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required().error("Payment status is required"),
      initialValue: "pending",
    }),

    defineField({
      name: "paymentMethod",
      title: "Payment Method",
      type: "string",
      description: "How the customer chose to pay",
      options: {
        list: [
          { title: "Mobile Money", value: "mobile_money" },
          { title: "Bank Transfer", value: "bank_transfer" },
          { title: "Cash on Delivery", value: "cash_on_delivery" },
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
      name: "notes",
      title: "Internal Notes",
      type: "text",
      description: "Internal admin notes about this order",
      rows: 3,
    }),

    defineField({
      name: "isActive",
      title: "Order Active",
      type: "boolean",
      description: "Is this order visible/active?",
      initialValue: true,
    }),

    defineField({
      name: "shippingAddress",
      title: "Shipping Address",
      type: "address",
      description: "Customer delivery address",
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
  ],

  preview: {
    select: {
      orderNumber: "orderNumber",
      customerEmail: "customer.email",
      customerName: "customer.firstName",
      total: "total",
      paymentStatus: "paymentStatus",
      status: "status",
      orderDate: "orderDate",
    },
    prepare({
      orderNumber,
      customerEmail,
      customerName,
      total,

      orderDate,
    }) {
      const totalFormatted = total
        ? `${total.toLocaleString()} UGX`
        : "No total";
      const date = orderDate ? new Date(orderDate).toLocaleDateString() : "";
      const customerDisplay =
        customerName || customerEmail || "Unknown Customer";
      return {
        title: `${orderNumber}`,
        subtitle: `${totalFormatted} • ${customerDisplay} • ${date}`,
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
