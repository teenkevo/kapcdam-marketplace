import { NextRequest, NextResponse } from "next/server";
import { trpc } from "@/trpc/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderTrackingId = searchParams.get("OrderTrackingId");
  const merchantReference = searchParams.get("OrderMerchantReference");

  if (!orderTrackingId) {
    return NextResponse.redirect("/donation/failed");
  }

  try {
    // Get transaction status
    const status = await trpc.payments.getTransactionStatus({
      order_tracking_id: orderTrackingId,
    });

    // Update donation status based on payment result
    if (status.payment_status_description === "Completed") {
      await trpc.donations.updateStatus({
        donationId: merchantReference!,
        paymentStatus: "completed",
        transactionId: status.transaction_id,
        orderTrackingId: orderTrackingId,
        confirmationCode: status.confirmation_code,
        paidAt: new Date().toISOString(),
        paymentMethod: status.payment_method,
        amount: status.amount,
        isRecurring: false, 
      });

      return NextResponse.redirect(
        `/donate/success?ref=${merchantReference}`
      );
    } else {
      await trpc.donations.updateStatus({
        donationId: merchantReference!,
        paymentStatus: "failed",
        orderTrackingId: orderTrackingId,
      });

      return NextResponse.redirect(`/donate/failed?ref=${merchantReference}`);
    }
  } catch (error) {
    console.error("Donation callback error:", error);
    return NextResponse.redirect("/donation/failed");
  }
}
