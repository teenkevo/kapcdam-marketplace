import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import OrderPendingOrFailedView from "@/features/orders/ui/views/order-pending-or-failed-view";
import OrderSuccessView from "@/features/orders/ui/views/order-success-view";
import PaymentRedirectView from "@/features/orders/ui/views/payment-redirect-view";
import { trpc } from "@/trpc/server";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderCheckoutPage({ params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { orderId } = await params;

  if (!orderId) {
    redirect("/marketplace");
  }

  const meta = await trpc.orders.getOrderStatus({ orderId });

  if (meta.paymentMethod === "pesapal") {
    if (
      meta.paymentStatus === "not_initiated" &&
      meta.status === "pending" &&
      !meta.transactionId
    ) {
      return <PaymentRedirectView orderId={orderId} />;
    }
    if (
      (meta.paymentStatus === "pending" || meta.paymentStatus === "failed") &&
      meta.status === "pending" &&
      meta.transactionId
    ) {
      return (
        <OrderPendingOrFailedView orderId={orderId} mode={meta.paymentStatus} />
      );
    }
    if (meta.paymentStatus === "paid" && meta.status === "confirmed") {
      return <OrderSuccessView orderId={orderId} />;
    }
  }

  if (meta.paymentMethod === "cod") {
    return <OrderSuccessView orderId={orderId} />;
  }

  return <OrderPendingOrFailedView orderId={orderId} />;
}
