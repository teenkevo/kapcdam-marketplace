import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = `/checkout/${orderId}`;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl, 302);
  } catch {
    const fallbackUrl = new URL(request.url);
    fallbackUrl.pathname = "/marketplace";
    fallbackUrl.search = "";
    return NextResponse.redirect(fallbackUrl, 302);
  }
}
