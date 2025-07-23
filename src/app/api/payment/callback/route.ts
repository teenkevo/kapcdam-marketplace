import { NextRequest, NextResponse } from "next/server";
import { trpc } from "@/trpc/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderTrackingId = searchParams.get("OrderTrackingId");
  const merchantReference = searchParams.get("OrderMerchantReference");

  console.log("Callback received:", { orderTrackingId, merchantReference });

  if (!orderTrackingId) {
    console.log("No orderTrackingId provided");
    return NextResponse.redirect(`${request.nextUrl.origin}/payment/failed`);
  }

  try {
    // Get transaction status
    console.log("Fetching transaction status for:", orderTrackingId);

    const status = await trpc.payments.getTransactionStatus({
      order_tracking_id: orderTrackingId,
    });

    console.log("Transaction status:", status);

    // Update donation status if it's a donation
    if (merchantReference && merchantReference.startsWith("DON-")) {
      console.log("Updating donation status for:", merchantReference);

      await trpc.donations.updateStatus({
        donationId: merchantReference,
        paymentStatus:
          status.payment_status_description === "Completed"
            ? "completed"
            : "failed",
        orderTrackingId: orderTrackingId,
        confirmationCode: status.confirmation_code,
        paidAt: new Date().toISOString(),
        paymentMethod: status.payment_method,
        amount: status.amount,
        isRecurring: false,
      });

      console.log("Donation status updated successfully");
    }

    console.log(
      "Payment status description:",
      status.payment_status_description
    );

    // Check for exact PESAPAL status values
    if (
      status.payment_status_description === "Completed" ||
      status.payment_status_description === "COMPLETED"
    ) {
      console.log("Payment successful, redirecting to success page");

      if (merchantReference && merchantReference.startsWith("DON-")) {
        return NextResponse.redirect(
          `${request.nextUrl.origin}/donate/thank-you?ref=${merchantReference}`
        );
      }
      return NextResponse.redirect(
        `${request.nextUrl.origin}/payment/success?ref=${merchantReference}`
      );
    } else {
      console.log(
        "Payment not completed, status:",
        status.payment_status_description
      );
      return NextResponse.redirect(
        `${request.nextUrl.origin}/payment/failed?ref=${merchantReference}`
      );
    }
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`${request.nextUrl.origin}/payment/failed`);
  }
}
