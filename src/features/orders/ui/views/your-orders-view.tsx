"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { YourOrderCard } from "../components/your-order-card";
import { OrderFilters } from "../components/order-filters";
import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useQueryStates, parseAsString } from "nuqs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function YourOrdersView() {
  const { isSignedIn } = useUser();
  const trpc = useTRPC();

  // Get filter params from URL
  const [urlParams] = useQueryStates({
    timeRange: parseAsString.withDefault("all"),
    searchQuery: parseAsString.withDefault(""),
  });

  // Convert URL params to API params
  const apiParams = {
    limit: 20,
    offset: 0,
    timeRange: urlParams.timeRange !== "all" ? urlParams.timeRange : undefined,
    searchQuery: urlParams.searchQuery || undefined,
  };

  const {
    data: orders,
    isLoading,
    error,
  } = useQuery({
    ...trpc.orders.getUserOrders.queryOptions(apiParams),
    enabled: isSignedIn,
  });

  if (!isSignedIn) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Your Account</Link>
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sign in to view your orders
          </h3>
          <p className="text-gray-500 mb-6">
            Your order history will appear here after you sign in.
          </p>
          <Button asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Your Account</Link>
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
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Your Account</Link>
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to load orders
          </h3>
          <p className="text-gray-500 mb-6">
            We couldn't load your orders. Please try again later.
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Your Account</Link>
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No orders yet
          </h3>
          <p className="text-gray-500 mb-6">
            When you place orders, they'll appear here. Start shopping to see
            your order history.
          </p>
          <Button asChild>
            <Link href="/marketplace">Start shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Extract user join date from first order (all orders have the same user)
  const userJoinDate =
    Array.isArray(orders) && orders.length > 0
      ? orders[0].userJoinDate
      : undefined;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Your Account</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Your Orders</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Orders</h1>
      </div>

      <OrderFilters
        totalOrders={Array.isArray(orders) ? orders.length : 0}
        userJoinDate={userJoinDate}
      />

      <div className="space-y-6">
        {Array.isArray(orders) &&
          orders.map((order) => (
            <YourOrderCard key={order._id} order={order} />
          ))}
      </div>
    </div>
  );
}
