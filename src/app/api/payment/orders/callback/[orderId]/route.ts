import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { trpc } from "@/trpc/server";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { userId } = await auth();

    if (!userId) {
      console.log("❌ CALLBACK: No authenticated user, redirecting to sign-in");
      const signInUrl = new URL(request.url);
      signInUrl.pathname = "/sign-in";
      signInUrl.search = "";
      return NextResponse.redirect(signInUrl, 302);
    }

    console.log(`🔄 CALLBACK: Processing post-payment actions for order ${orderId}`);

    // Get current order status to determine what actions to take
    const order = await client.fetch(
      groq`*[_type == "order" && _id == $orderId && customer->clerkUserId == $userId][0]{
        _id,
        orderNumber,
        paymentStatus,
        status,
        paymentMethod,
        stockUpdated,
        total
      }`,
      { orderId, userId }
    );

    if (!order) {
      console.log(`❌ CALLBACK: Order ${orderId} not found or access denied`);
      const fallbackUrl = new URL(request.url);
      fallbackUrl.pathname = "/marketplace";
      fallbackUrl.search = "";
      return NextResponse.redirect(fallbackUrl, 302);
    }

    console.log(`✅ CALLBACK: Order found`, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      paymentMethod: order.paymentMethod
    });

    // Handle post-payment actions for successful payments
    if (order.paymentStatus === "paid" && order.paymentMethod === "pesapal") {
      try {
        // 1. Update order status if needed
        if (order.status === "PENDING_PAYMENT") {
          console.log(`🔄 CALLBACK: Updating order status to PROCESSING`);
          await trpc.orders.updateOrderStatus({
            orderId: order._id,
            status: "PROCESSING",
            notes: "Status updated via callback after successful payment",
          });
          console.log(`✅ CALLBACK: Order status updated to PROCESSING`);
        }

        // 2. Update stock if not already done
        if (!order.stockUpdated) {
          console.log(`🔄 CALLBACK: Updating stock for order ${order.orderNumber}`);
          const stockResult = await trpc.orders.updateStockAfterPayment({
            orderId: order._id,
          });
          console.log(`✅ CALLBACK: Stock update result:`, stockResult);
        } else {
          console.log(`ℹ️ CALLBACK: Stock already updated for order ${order.orderNumber}`);
        }

        // 3. Cleanup old orders (with delay to ensure operations complete)
        setTimeout(async () => {
          try {
            console.log(`🔄 CALLBACK: Starting cleanup of old orders`);
            const cleanupResult = await trpc.orders.cleanupOldPesapalOrders({
              orderId: order._id,
            });
            console.log(`✅ CALLBACK: Cleanup result:`, cleanupResult);
          } catch (cleanupError) {
            console.error(`❌ CALLBACK: Cleanup failed:`, cleanupError);
          }
        }, 1000);

      } catch (error) {
        console.error(`❌ CALLBACK: Post-payment actions failed:`, error);
        // Don't block redirect on errors, just log them
      }
    }

    // Redirect to checkout page
    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = `/checkout/${orderId}`;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl, 302);

  } catch (error) {
    console.error(`❌ CALLBACK: Error processing callback:`, error);
    const fallbackUrl = new URL(request.url);
    fallbackUrl.pathname = "/marketplace";
    fallbackUrl.search = "";
    return NextResponse.redirect(fallbackUrl, 302);
  }
}
