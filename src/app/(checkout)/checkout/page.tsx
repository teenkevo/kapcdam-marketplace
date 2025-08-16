import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CheckoutView from "@/features/checkout/ui/views/checkout-view";
import { isAdminUser } from "@/features/auth/lib/roles";

const CheckoutPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/checkout");
  }

  // Block admin users from accessing checkout
  const isAdmin = await isAdminUser();
  if (isAdmin) {
    redirect("/admin/manage-orders?message=checkout-restricted");
  }

  return <CheckoutView />;
};

export default CheckoutPage;
