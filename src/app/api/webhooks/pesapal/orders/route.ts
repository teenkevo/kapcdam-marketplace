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

    const isDemoMode = process.env.DEMO_PAYMENTS_ENABLED === "true";
    console.log(`🔔 WEBHOOK ${isDemoMode ? '(DEMO MODE)' : '(LIVE)'}: Processing order webhook`, {
      OrderTrackingId,
      OrderNotificationType,
      OrderMerchantReference,
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type'),
      isDemoMode,
      timestamp: new Date().toISOString()
    });

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
      console.error(`🚨 WEBHOOK ERROR ${isDemoMode ? '(DEMO MODE)' : '(LIVE)'}: Order not found`, {
        OrderMerchantReference,
        OrderTrackingId,
        possibleCause: "Order may have been deleted during order creation process",
        suggestion: "Check if order deletion timing is causing race condition",
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 500,
      });
    }
    console.log(`✅ WEBHOOK ${isDemoMode ? '(DEMO MODE)' : '(LIVE)'}: Order found`, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      paymentStatus: order.paymentStatus
    });
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
   
    let paymentStatus: "paid" | "failed" | "refunded";
    let orderStatus: "PROCESSING" | "FAILED_PAYMENT" | "REFUNDED";

    switch (transactionStatus.payment_status_description?.toLowerCase()) {
      case "completed":
        paymentStatus = "paid";
        orderStatus = "PROCESSING";
        break;
      case "reversed":
        paymentStatus = "refunded";
        orderStatus = "REFUNDED";
        break;
      case "invalid":
      case "failed":
      default:
        paymentStatus = "failed";
        orderStatus = "FAILED_PAYMENT";
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
      confirmationCode: transactionStatus.confirmation_code || null,
      paidAt: paymentStatus === "paid" ? new Date().toISOString() : undefined,
    });

    // Note: Order status updates moved to callback where we have authentication context
    console.log(`✅ WEBHOOK ${isDemoMode ? '(DEMO MODE)' : '(LIVE)'}: Payment status updated`, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      newPaymentStatus: paymentStatus,
      expectedOrderStatus: orderStatus,
      note: "Order status will be updated when user returns via callback"
    });



    return NextResponse.json({
      orderNotificationType: OrderNotificationType,
      orderTrackingId: OrderTrackingId,
      orderMerchantReference: OrderMerchantReference,
      status: 200,
    });
  } catch (error) {
    console.error("Order webhook processing error:", error);

    
    let webhookData: Partial<PesapalWebhookPayload> = {};
    try {
      const body = await request.clone().json();
      webhookData = body;
    } catch {
     
    }

    return NextResponse.json({
      orderNotificationType: webhookData.OrderNotificationType || "UNKNOWN",
      orderTrackingId: webhookData.OrderTrackingId || "UNKNOWN",
      orderMerchantReference: webhookData.OrderMerchantReference || "UNKNOWN",
      status: 500,
    });
  }
}
