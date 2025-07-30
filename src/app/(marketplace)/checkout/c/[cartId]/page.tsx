import CheckoutView from "@/features/checkout/ui/views/checkout-view";

interface CheckOutPageProps {
  params: {
    cartId: string;
  };
}

const CheckOutPage = ({ params }: CheckOutPageProps) => {
  return <CheckoutView cartId={params.cartId} />;
};

export default CheckOutPage;
