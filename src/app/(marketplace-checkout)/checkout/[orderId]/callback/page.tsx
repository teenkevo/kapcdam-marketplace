import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { trpc } from "@/trpc/server";

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ 
    OrderTrackingId?: string;
    OrderMerchantReference?: string;
  }>;
}

export default async function OrderCallbackPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { OrderTrackingId, OrderMerchantReference } = await searchParams;

  console.log("Order callback received:", { 
    orderId, 
    OrderTrackingId, 
    OrderMerchantReference 
  });

  if (!OrderTrackingId) {
    console.log("No OrderTrackingId provided, redirecting to order page");
    redirect(`/checkout/${orderId}`);
  }

  try {
    // Get transaction status from Pesapal
    console.log("Fetching transaction status for:", OrderTrackingId);
    
    const status = await trpc.payments.getTransactionStatus({
      order_tracking_id: OrderTrackingId,
    });

    console.log("Transaction status:", status);

    // Update order payment status
    const paymentStatus = 
      status.payment_status_description === "Completed" || 
      status.payment_status_description === "COMPLETED" 
        ? "paid" 
        : "failed";

    await trpc.orders.updatePaymentStatus({
      orderId,
      paymentStatus,
      transactionId: OrderTrackingId,
      paidAt: paymentStatus === "paid" ? new Date().toISOString() : undefined,
    });

    console.log(`Order ${orderId} payment status updated to: ${paymentStatus}`);

    // Redirect based on payment outcome
    if (paymentStatus === "paid") {
      console.log("Payment successful, redirecting to success page");
      redirect(`/checkout/${orderId}/success`);
    } else {
      console.log("Payment failed, redirecting back to order page");
      redirect(`/checkout/${orderId}`);
    }

  } catch (error) {
    console.error("Order callback error:", error);
    // Redirect back to order page on error
    redirect(`/checkout/${orderId}`);
  }
}