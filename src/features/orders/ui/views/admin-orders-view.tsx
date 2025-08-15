"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { AdminOrderCard } from "../components/admin-order-card";
import { AdminOrdersViewSkeleton } from "../components/admin-orders-view-skeleton";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { AdminOrderResponse } from "../../schema";

type OrderStatus =
  | "all"
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled";
type PaymentStatus =
  | "all"
  | "not_initiated"
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

type TabFilter = "all" | "pending" | "ready" | "cancelled";

export function AdminOrdersView() {
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatus>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [activeItem, setActiveItem] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  const limit = 20;
  const offset = currentPage * limit;

  // Get all orders (no server-side filtering except search for performance)
  const {
    data: allOrders,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...trpc.adminOrders.getAllOrders.queryOptions({
      limit: 200, // Get more orders for client-side filtering
      offset: 0,
      status: "all",
      paymentStatus: "all", 
      searchQuery: searchQuery.trim() || undefined,
    }),
  });

  // Client-side filtering and calculations
  const { filteredOrders, tabCounts } = useMemo(() => {
    console.log("🔍 Raw allOrders data:", allOrders);
    
    if (!allOrders || !Array.isArray(allOrders)) {
      console.log("❌ No allOrders data available or not an array");
      return { filteredOrders: [], tabCounts: { all: 0, pending: 0, ready: 0, cancelled: 0 } };
    }

    console.log("✅ Orders count:", allOrders.length);
    console.log("📋 Sample order structure:", allOrders[0]);
    
    // Calculate tab counts
    const counts = {
      all: allOrders.length,
      pending: allOrders.filter(order => 
        order.status === "confirmed" || order.status === "processing"
      ).length,
      ready: allOrders.filter(order => 
        order.status === "ready" || order.status === "shipped"
      ).length,
      cancelled: allOrders.filter(order => order.status === "cancelled").length,
    };

    console.log("📊 Tab counts:", counts);

    // Filter orders based on active tab
    let filtered = allOrders;
    if (activeTab === "pending") {
      filtered = allOrders.filter(order => 
        order.status === "confirmed" || order.status === "processing"
      );
    } else if (activeTab === "ready") {
      filtered = allOrders.filter(order => 
        order.status === "ready" || order.status === "shipped"
      );
    } else if (activeTab === "cancelled") {
      filtered = allOrders.filter(order => order.status === "cancelled");
    }
    // "all" tab shows everything

    console.log(`🎯 Filtered orders for tab "${activeTab}":`, filtered.length);

    return { filteredOrders: filtered, tabCounts: counts };
  }, [allOrders, activeTab]);

  // Paginate filtered orders
  const paginatedOrders = useMemo(() => {
    const startIndex = currentPage * limit;
    return filteredOrders.slice(startIndex, startIndex + limit);
  }, [filteredOrders, currentPage, limit]);

  useEffect(() => {
    if (paginatedOrders && paginatedOrders.length > 0) {
      setActiveItem(paginatedOrders[0].orderId);
    }
  }, [paginatedOrders]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  // Get statistics
  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
  } = useQuery({
    ...trpc.adminOrders.getOrdersStats.queryOptions(),
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(0); // Reset to first page
  };

  const handleStatusFilter = (status: OrderStatus) => {
    setStatusFilter(status);
    setCurrentPage(0); // Reset to first page
  };

  const handlePaymentStatusFilter = (paymentStatus: PaymentStatus) => {
    setPaymentStatusFilter(paymentStatus);
    setCurrentPage(0); // Reset to first page
  };

  // Tab configuration
  const tabs = [
    { id: "all" as TabFilter, label: "All Orders", count: tabCounts.all },
    { id: "pending" as TabFilter, label: "Pending", count: tabCounts.pending },
    { id: "ready" as TabFilter, label: "Ready for Pickup/Delivery", count: tabCounts.ready },
    { id: "cancelled" as TabFilter, label: "Cancelled", count: tabCounts.cancelled },
  ];

  if (isLoading) {
    return <AdminOrdersViewSkeleton />;
  }

  if (error) {
    console.error("❌ Orders query error:", error);
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-red-500 mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unable to load orders
        </h3>
        <p className="text-gray-500 mb-6">
          We couldn't load the orders. Please check the console for details.
        </p>
        <details className="mb-4 text-left max-w-lg">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            Show error details
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  if (!allOrders || !Array.isArray(allOrders) || allOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No orders found
        </h3>
        <p className="text-gray-500 mb-6">
          {searchQuery || activeTab !== "all"
            ? "No orders match your current filters. Try adjusting your search criteria."
            : "No orders have been placed yet."}
        </p>
        {(searchQuery || activeTab !== "all") && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setActiveTab("all");
              setCurrentPage(0);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards - temporarily disabled for build fix */}
      {!isStatsLoading && !statsError && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-gray-900">
              {(stats as any)?.totalOrders || 0}
            </div>
            <div className="text-sm text-gray-500">Total Orders</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">
              {(stats as any)?.pendingOrders || 0}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {(stats as any)?.confirmedOrders || 0}
            </div>
            <div className="text-sm text-gray-500">Confirmed</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">
              {(stats as any)?.processingOrders || 0}
            </div>
            <div className="text-sm text-gray-500">Processing</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {(stats as any)?.deliveredOrders || 0}
            </div>
            <div className="text-sm text-gray-500">Delivered</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-gray-600">
              {(stats as any)?.cancelledOrders || 0}
            </div>
            <div className="text-sm text-gray-500">Cancelled</div>
          </div>
        </div>
      )}

      {/* Order Tabs */}
      <div className="bg-white rounded-lg border">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-[#C5F82A] text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Search Section */}
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search orders (order number, customer name, email, items...)"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Active Filters */}
          {searchQuery && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setSearchQuery("")}
              >
                Search: "{searchQuery}" ×
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Orders List */}
      {paginatedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-lg border">
          <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No orders found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery 
              ? `No orders match your search "${searchQuery}" in the ${tabs.find(t => t.id === activeTab)?.label} tab.`
              : `No orders in the ${tabs.find(t => t.id === activeTab)?.label} tab.`
            }
          </p>
          {(searchQuery || activeTab !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setActiveTab("all");
                setCurrentPage(0);
              }}
            >
              View all orders
            </Button>
          )}
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          value={activeItem}
          onValueChange={setActiveItem}
          className="space-y-4"
        >
          {paginatedOrders?.map?.((order) => (
            <AdminOrderCard
              key={order.orderId}
              order={order}
              onOrderUpdated={refetch}
              isActive={activeItem === order.orderId}
            />
          ))}
        </Accordion>
      )}

      {/* Pagination */}
      {filteredOrders.length > limit && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 py-2 text-sm text-gray-700">
            Page {currentPage + 1} of {Math.ceil(filteredOrders.length / limit)}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={(currentPage + 1) * limit >= filteredOrders.length}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
