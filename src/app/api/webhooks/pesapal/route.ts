import { NextRequest, NextResponse } from "next/server";
import { trpc } from "@/trpc/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { OrderTrackingId, OrderNotificationType, OrderMerchantReference } =
      body;

    // Handle recurring donations
    if (OrderNotificationType === "RECURRING") {
      const result = await trpc.donations.handleRecurringPayment({
        orderTrackingId: OrderTrackingId,
        originalDonationId: OrderMerchantReference, 
      });
      return NextResponse.json(result);
    }

    // Check if it's a donation (donation IDs start with "DON-")
    if (OrderMerchantReference.startsWith("DON-")) {
      // Handle initial donation payment
      const transactionStatus = await trpc.payments.getTransactionStatus({
        order_tracking_id: OrderTrackingId,
      });

      const result = await trpc.donations.updateStatus({
        donationId: OrderMerchantReference,
        paymentStatus:
          transactionStatus.payment_status_description === "Completed"
            ? "completed"
            : "failed",
        orderTrackingId: OrderTrackingId,
        confirmationCode: transactionStatus.confirmation_code,
        paidAt: new Date().toISOString(),
        paymentMethod: transactionStatus.payment_method,
        amount: transactionStatus.amount,
        isRecurring: false, 
      });

      return NextResponse.json({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 200,
      });
    }

    // Handle regular product payments (existing logic)
    const result = await trpc.payments.handleIpnNotification({
      OrderTrackingId,
      OrderNotificationType,
      OrderMerchantReference,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  try {
    const OrderTrackingId = searchParams.get("OrderTrackingId")!;
    const OrderNotificationType = searchParams.get("OrderNotificationType")!;
    const OrderMerchantReference = searchParams.get("OrderMerchantReference")!;

    // Same logic as POST but with URL params
    if (OrderNotificationType === "RECURRING") {
      const result = await trpc.donations.handleRecurringPayment({
        orderTrackingId: OrderTrackingId,
        originalDonationId: OrderMerchantReference,
      });
      return NextResponse.json(result);
    }

    if (OrderMerchantReference.startsWith("DON-")) {
      const transactionStatus = await trpc.payments.getTransactionStatus({
        order_tracking_id: OrderTrackingId,
      });

      const result = await trpc.donations.updateStatus({
        donationId: OrderMerchantReference,
        paymentStatus:
          transactionStatus.payment_status_description === "Completed"
            ? "completed"
            : "failed",
        orderTrackingId: OrderTrackingId,
        confirmationCode: transactionStatus.confirmation_code,
        paidAt: new Date().toISOString(),
        paymentMethod: transactionStatus.payment_method,
        amount: transactionStatus.amount,
        isRecurring: false,
      });

      return NextResponse.json({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 200,
      });
    }

    const result = await trpc.payments.handleIpnNotification({
      OrderTrackingId,
      OrderNotificationType,
      OrderMerchantReference,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ status: 500 });
  }
}
