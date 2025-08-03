import CheckoutView from "@/features/checkout/ui/views/checkout-view";

interface CheckOutPageProps {
  params: Promise<{
    cartId: string;
  }>;
}

const CheckOutPage = async ({ params }: CheckOutPageProps) => {
  const cartId = (await params).cartId;
  return <CheckoutView cartId={cartId} />;
};

export default CheckOutPage;
