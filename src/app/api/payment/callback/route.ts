import { NextRequest, NextResponse } from "next/server";
import { trpc } from "@/trpc/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderTrackingId = searchParams.get("OrderTrackingId");
  const merchantReference = searchParams.get("OrderMerchantReference");
  const orderId = searchParams.get("orderId"); // Order ID from callback URL

  console.log("Callback received:", { orderTrackingId, merchantReference, orderId });

  if (!orderTrackingId) {
    console.log("No orderTrackingId provided");
    if (orderId) {
      return NextResponse.redirect(`${request.nextUrl.origin}/checkout/${orderId}`);
    }
    return NextResponse.redirect(`${request.nextUrl.origin}/payment/failed`);
  }

  try {
    // Get transaction status
    console.log("Fetching transaction status for:", orderTrackingId);

    const status = await trpc.payments.getTransactionStatus({
      order_tracking_id: orderTrackingId,
    });

    console.log("Transaction status:", status);

    // Determine payment outcome
    const isPaymentSuccessful = 
      status.payment_status_description === "Completed" || 
      status.payment_status_description === "COMPLETED";

    // Handle order payments (identified by orderId parameter)
    if (orderId) {
      console.log("Processing order payment callback for order:", orderId);

      const paymentStatus = isPaymentSuccessful ? "paid" : "failed";

      await trpc.orders.updatePaymentStatus({
        orderId,
        paymentStatus,
        transactionId: orderTrackingId,
        paidAt: isPaymentSuccessful ? new Date().toISOString() : undefined,
      });

      console.log(`Order ${orderId} payment status updated to: ${paymentStatus}`);

      // Redirect to order-specific pages
      if (isPaymentSuccessful) {
        return NextResponse.redirect(`${request.nextUrl.origin}/checkout/${orderId}/success`);
      } else {
        return NextResponse.redirect(`${request.nextUrl.origin}/checkout/${orderId}`);
      }
    }

    // Handle donation payments (legacy logic)
    if (merchantReference && merchantReference.startsWith("DON-")) {
      console.log("Updating donation status for:", merchantReference);

      await trpc.donations.updateStatus({
        donationId: merchantReference,
        paymentStatus: isPaymentSuccessful ? "completed" : "failed",
        orderTrackingId: orderTrackingId,
        confirmationCode: status.confirmation_code,
        paidAt: new Date().toISOString(),
        paymentMethod: status.payment_method,
        amount: status.amount,
        isRecurring: false,
      });

      console.log("Donation status updated successfully");

      if (isPaymentSuccessful) {
        return NextResponse.redirect(
          `${request.nextUrl.origin}/donate/thank-you?ref=${merchantReference}`
        );
      } else {
        return NextResponse.redirect(
          `${request.nextUrl.origin}/donate/failed?ref=${merchantReference}`
        );
      }
    }

    // Fallback for other payments (legacy)
    console.log(
      "Payment status description:",
      status.payment_status_description
    );

    if (isPaymentSuccessful) {
      console.log("Payment successful, redirecting to success page");
      return NextResponse.redirect(
        `${request.nextUrl.origin}/payment/success?ref=${merchantReference}`
      );
    } else {
      console.log("Payment not completed, status:", status.payment_status_description);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/payment/failed?ref=${merchantReference}`
      );
    }
  } catch (error) {
    console.error("Callback error:", error);
    if (orderId) {
      return NextResponse.redirect(`${request.nextUrl.origin}/checkout/${orderId}`);
    }
    return NextResponse.redirect(`${request.nextUrl.origin}/payment/failed`);
  }
}
