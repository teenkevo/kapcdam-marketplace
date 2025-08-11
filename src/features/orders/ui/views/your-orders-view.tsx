"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { YourOrderCard } from "../components/your-order-card";
import { OrderFilters } from "../components/order-filters";
import { YourOrdersViewSkeleton } from "../components/your-orders-view-skeleton";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useQueryStates, parseAsString } from "nuqs";

export default function YourOrdersView() {
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
  });

  if (isLoading) {
    return <YourOrdersViewSkeleton />;
  }

  if (error) {
    return (
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
    );
  }

  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No orders yet
        </h3>
        <p className="text-gray-500 mb-6">
          When you place orders, they'll appear here. Start shopping to see your
          order history.
        </p>
        <Button asChild>
          <Link href="/marketplace">Start shopping</Link>
        </Button>
      </div>
    );
  }

  // Extract user join date from first order (all orders have the same user)
  const userJoinDate =
    Array.isArray(orders) && orders.length > 0
      ? orders[0].userJoinDate
      : undefined;

  return (
    <>
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
    </>
  );
}
