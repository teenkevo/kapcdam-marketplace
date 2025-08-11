import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
  BreadcrumbItem,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import YourOrdersView from "@/features/orders/ui/views/your-orders-view";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

const Page = async () => {
  const user = await auth();
  if (!user.userId) return redirect("/sign-in?redirect_url=/your-orders");

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Your Orders</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold">Your Orders</h1>
      </div>
      <YourOrdersView />
    </div>
  );
};

export default Page;
