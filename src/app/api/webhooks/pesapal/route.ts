import { NextRequest, NextResponse } from "next/server";
import { trpc } from "@/trpc/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await trpc.payments.handleIpnNotification({
      OrderTrackingId: body.OrderTrackingId,
      OrderNotificationType: body.OrderNotificationType,
      OrderMerchantReference: body.OrderMerchantReference,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  try {
    const result = await trpc.payments.handleIpnNotification({
      OrderTrackingId: searchParams.get("OrderTrackingId")!,
      OrderNotificationType: searchParams.get("OrderNotificationType")!,
      OrderMerchantReference: searchParams.get("OrderMerchantReference")!,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ status: 500 });
  }
}
