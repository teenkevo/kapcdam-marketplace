import { NextRequest, NextResponse } from "next/server";
import { trpc } from "@/trpc/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderTrackingId = searchParams.get("OrderTrackingId");
  const merchantReference = searchParams.get("OrderMerchantReference");

  console.log("Donation callback received:", { orderTrackingId, merchantReference });

  if (!orderTrackingId) {
    console.log("No orderTrackingId provided for donation");
    return NextResponse.redirect(`${request.nextUrl.origin}/donate/failed`);
  }

  try {
    // Get transaction status
    console.log("Fetching transaction status for donation:", orderTrackingId);

    const status = await trpc.payments.getTransactionStatus({
      order_tracking_id: orderTrackingId,
    });

    console.log("Donation transaction status:", status);

    // Determine payment outcome
    const isPaymentSuccessful = 
      status.payment_status_description === "Completed" || 
      status.payment_status_description === "COMPLETED";

    // Handle donation payments
    if (merchantReference && merchantReference.startsWith("DON-")) {
      console.log("Processing donation callback for:", merchantReference);

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

      console.log(`Donation ${merchantReference} status updated to: ${isPaymentSuccessful ? "completed" : "failed"}`);

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

    // Fallback for donations without proper merchant reference
    console.log(
      "Donation payment status description:",
      status.payment_status_description
    );

    if (isPaymentSuccessful) {
      console.log("Donation payment successful, redirecting to success page");
      return NextResponse.redirect(
        `${request.nextUrl.origin}/donate/thank-you?ref=${merchantReference || 'unknown'}`
      );
    } else {
      console.log("Donation payment not completed, status:", status.payment_status_description);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/donate/failed?ref=${merchantReference || 'unknown'}`
      );
    }
  } catch (error) {
    console.error("Donation callback error:", error);
    return NextResponse.redirect(`${request.nextUrl.origin}/donate/failed`);
  }
}
