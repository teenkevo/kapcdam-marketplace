import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import OrderSuccessView from "@/features/orders/ui/views/order-success-view";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderSuccessPage({ params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { orderId } = await params;
  return <OrderSuccessView orderId={orderId} />;
}