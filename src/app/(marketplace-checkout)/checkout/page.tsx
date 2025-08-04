import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CheckoutView from "@/features/checkout/ui/views/checkout-view";

const CheckoutPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/checkout");
  }
  return <CheckoutView />;
};

export default CheckoutPage;
