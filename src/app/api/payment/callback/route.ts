import { NextRequest, NextResponse } from "next/server";
import { trpc } from "@/trpc/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderTrackingId = searchParams.get("OrderTrackingId");
  const merchantReference = searchParams.get("OrderMerchantReference");

  if (!orderTrackingId) {
    return NextResponse.redirect("/payment/failed");
  }

  try {
    const status = await trpc.payments.getTransactionStatus({
      order_tracking_id: orderTrackingId,
    });

    if (status.payment_status_description === "Completed") {
      return NextResponse.redirect(`/payment/success?ref=${merchantReference}`);
    } else {
      return NextResponse.redirect(`/payment/failed?ref=${merchantReference}`);
    }
  } catch (error) {
    return NextResponse.redirect("/payment/failed");
  }
}
