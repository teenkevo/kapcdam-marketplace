import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import OrderCheckoutView from "./order-checkout-view";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderCheckoutPage({ params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { orderId } = await params;
  return <OrderCheckoutView orderId={orderId} />;
}