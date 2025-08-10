import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import OrderPendingOrFailedView from "@/features/orders/ui/views/order-pending-or-failed-view";
import OrderSuccessView from "@/features/orders/ui/views/order-success-view";
import PaymentRedirectView from "@/features/orders/ui/views/payment-redirect-view";
import { trpc } from "@/trpc/server";
import { CheckoutStateManager } from "./checkout-state-manager";

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

  let viewComponent: React.ReactNode;
  let viewType: 'payment-redirect' | 'pending-failed' | 'success';
  let mode: 'pending' | 'failed' | undefined;

  if (meta.paymentMethod === "pesapal") {
    if (
      meta.paymentStatus === "not_initiated" &&
      meta.status === "pending" &&
      !meta.transactionId
    ) {
      viewComponent = <PaymentRedirectView orderId={orderId} />;
      viewType = "payment-redirect";
    } else if (
      (meta.paymentStatus === "pending" || meta.paymentStatus === "failed") &&
      meta.status === "pending" &&
      meta.transactionId
    ) {
      viewComponent = <OrderPendingOrFailedView orderId={orderId} mode={meta.paymentStatus} />;
      viewType = "pending-failed";
      mode = meta.paymentStatus;
    } else if (meta.paymentStatus === "paid" && meta.status === "confirmed") {
      viewComponent = <OrderSuccessView orderId={orderId} />;
      viewType = "success";
    } else {
      viewComponent = <OrderPendingOrFailedView orderId={orderId} />;
      viewType = "pending-failed";
    }
  } else if (meta.paymentMethod === "cod") {
    viewComponent = <OrderSuccessView orderId={orderId} />;
    viewType = "success";
  } else {
    viewComponent = <OrderPendingOrFailedView orderId={orderId} />;
    viewType = "pending-failed";
  }

  return (
    <>
      <CheckoutStateManager 
        paymentStatus={meta.paymentStatus}
        orderStatus={meta.status}
        paymentMethod={meta.paymentMethod}
        view={viewType}
        mode={mode}
      />
      {viewComponent}
    </>
  );
}
