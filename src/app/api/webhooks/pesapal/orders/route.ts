import { NextRequest, NextResponse } from "next/server";
import { trpc } from "@/trpc/server";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";

interface PesapalWebhookPayload {
  OrderTrackingId: string;
  OrderNotificationType: string;
  OrderMerchantReference: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PesapalWebhookPayload = await request.json();
    const { OrderTrackingId, OrderNotificationType, OrderMerchantReference } =
      body;

    console.log("Processing order webhook....");

    // Find the order by orderNumber (OrderMerchantReference)
    const order = await client.fetch(
      groq`*[_type == "order" && orderNumber == $orderNumber][0] {
        _id,
        orderNumber,
        paymentStatus,
        status,
        total,
        transactionId,
        orderItems[] {
          type,
          quantity,
          variantSku,
          product->{_id, hasVariants, totalStock},
          course->{_id}
        }
      }`,
      { orderNumber: OrderMerchantReference }
    );

    if (!order) {
      console.error("Order not found:", OrderMerchantReference);
      return NextResponse.json({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 500,
      });
    }
    console.log("Order found-------");
    // Check if webhook already processed for this transaction
    if (
      order.transactionId === OrderTrackingId &&
      order.paymentStatus === "paid"
    ) {
      console.log(
        "Webhook already processed for transaction:",
        OrderTrackingId
      );
      return NextResponse.json({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 200,
      });
    }

    // Get transaction status from Pesapal
    const transactionStatus = await trpc.payments.getTransactionStatus({
      order_tracking_id: OrderTrackingId,
    });

    console.log("webhook Transaction status:", transactionStatus);

    // Map Pesapal status to our payment status
    // Per Pesapal docs, webhook delivers a final outcome only (no "pending")
    let paymentStatus: "paid" | "failed" | "refunded";
    let orderStatus: string;

    switch (transactionStatus.payment_status_description?.toLowerCase()) {
      case "completed":
        paymentStatus = "paid";
        orderStatus = "confirmed";
        break;
      case "reversed":
        paymentStatus = "refunded";
        orderStatus = order.status;
        break;
      case "invalid":
      case "failed":
      default:
        paymentStatus = "failed";
        orderStatus = order.status;
        break;
    }

    // Update order payment status
    await trpc.orders.updatePaymentStatus({
      orderId: order._id,
      paymentStatus: paymentStatus as
        | "paid"
        | "failed"
        | "refunded"
        | "not_initiated",
      transactionId: OrderTrackingId,
      paidAt: paymentStatus === "paid" ? new Date().toISOString() : undefined,
    });

    // If payment is successful, update stock levels
    if (paymentStatus === "paid" && order.orderItems?.length > 0) {
      console.log("Payment successful, updating stock levels...");

      const stockUpdates = [];

      for (const orderItem of order.orderItems) {
        if (orderItem.type === "product" && orderItem.product) {
          const product = orderItem.product;
          const quantity = orderItem.quantity;

          if (product.hasVariants && orderItem.variantSku) {
            // Update variant stock
            stockUpdates.push(
              client
                .patch(product._id)
                .dec({
                  [`variants[sku == "${orderItem.variantSku}"].stock`]:
                    quantity,
                })
                .commit()
            );
          } else if (!product.hasVariants && product.totalStock !== undefined) {
            // Update product total stock
            stockUpdates.push(
              client.patch(product._id).dec({ totalStock: quantity }).commit()
            );
          }
        }
      }

      // Execute all stock updates
      if (stockUpdates.length > 0) {
        await Promise.all(stockUpdates);
        console.log(
          `Updated stock for ${stockUpdates.length} products/variants`
        );
      }
    }

    console.log("Order webhook processed successfully:", {
      orderId: order._id,
      paymentStatus,
      orderStatus,
    });

    return NextResponse.json({
      orderNotificationType: OrderNotificationType,
      orderTrackingId: OrderTrackingId,
      orderMerchantReference: OrderMerchantReference,
      status: 200,
    });
  } catch (error) {
    console.error("Order webhook processing error:", error);

    // Extract the webhook data for error response
    let webhookData: Partial<PesapalWebhookPayload> = {};
    try {
      const body = await request.clone().json();
      webhookData = body;
    } catch {
      // Ignore if we can't parse the body for error response
    }

    return NextResponse.json({
      orderNotificationType: webhookData.OrderNotificationType || "UNKNOWN",
      orderTrackingId: webhookData.OrderTrackingId || "UNKNOWN",
      orderMerchantReference: webhookData.OrderMerchantReference || "UNKNOWN",
      status: 500,
    });
  }
}
