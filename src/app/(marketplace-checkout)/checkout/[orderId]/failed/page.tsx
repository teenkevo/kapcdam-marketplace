import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import PaymentFailedView from "./payment-failed-view";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function PaymentFailedPage({ params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { orderId } = await params;
  return <PaymentFailedView orderId={orderId} />;
}