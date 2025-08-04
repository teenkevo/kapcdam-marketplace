import { trpc } from "@/trpc/server";
import { redirect } from "next/navigation";

const CheckoutPage = async () => {
  const userCart = await trpc.cart.getUserCart();
  redirect(`/checkout/c/${userCart?._id}`);
};

export default CheckoutPage;
