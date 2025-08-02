import OrderConfirmationView from "@/features/orders/ui/views/order-confirmation-view";

interface OrderConfirmationPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { orderId } = await params;
  return <OrderConfirmationView orderId={orderId} />;
}