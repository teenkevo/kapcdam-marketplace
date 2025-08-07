import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import OrderCheckoutView from "@/features/orders/ui/views/order-checkout-view";
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

  const order = await trpc.orders.getOrderById({ orderId });
  console.log("validated order", JSON.stringify(order, null, 2));

  if (!order) {
    redirect("/marketplace");
  }

  if (
    order.paymentMethod === "pesapal" &&
    order.paymentStatus === "not_initiated"
  ) {
    const { paymentUrl, orderTrackingId } =
      await trpc.orders.processOrderPayment(order);
    await trpc.orders.updatePaymentStatus({
      orderId: order.orderId,
      paymentStatus: "initiated",
      transactionId: orderTrackingId,
    });
    redirect(paymentUrl);
  }

  return <div>Hello</div>;
  // return <OrderCheckoutView orderId={orderId} />;
}
