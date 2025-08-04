import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const CheckoutPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/checkout");
  }
  return null;
};

export default CheckoutPage;
