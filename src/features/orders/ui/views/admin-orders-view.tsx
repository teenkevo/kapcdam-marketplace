"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { AdminOrderCard } from "../components/admin-order-card";
import { AdminOrdersViewSkeleton } from "../components/admin-orders-view-skeleton";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OrderStatus = "all" | "pending" | "confirmed" | "processing" | "ready" | "shipped" | "delivered" | "cancelled";
type PaymentStatus = "all" | "not_initiated" | "pending" | "paid" | "failed" | "refunded";

export function AdminOrdersView() {
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus>("all");
  const [currentPage, setCurrentPage] = useState(0);
  
  const limit = 20;
  const offset = currentPage * limit;

  // Get orders
  const {
    data: orders,
    isLoading,
    error,
    refetch
  } = useQuery({
    ...trpc.adminOrders.getAllOrders.queryOptions({
      limit,
      offset,
      status: statusFilter,
      paymentStatus: paymentStatusFilter,
      searchQuery: searchQuery.trim() || undefined,
    }),
  });

  // Get statistics
  const { data: stats, isLoading: isStatsLoading, error: statsError } = useQuery({
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

  if (isLoading) {
    return <AdminOrdersViewSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-red-500 mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unable to load orders
        </h3>
        <p className="text-gray-500 mb-6">
          We couldn't load the orders. Please try again later.
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  if (!orders || (orders as any)?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No orders found
        </h3>
        <p className="text-gray-500 mb-6">
          {searchQuery || statusFilter !== "all" || paymentStatusFilter !== "all"
            ? "No orders match your current filters. Try adjusting your search criteria."
            : "No orders have been placed yet."
          }
        </p>
        {(searchQuery || statusFilter !== "all" || paymentStatusFilter !== "all") && (
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setPaymentStatusFilter("all");
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

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="Search orders (order number, customer name, email, items...)"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => handleStatusFilter(value as OrderStatus)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Order Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Status Filter */}
          <Select value={paymentStatusFilter} onValueChange={(value) => handlePaymentStatusFilter(value as PaymentStatus)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="not_initiated">Not Initiated</SelectItem>
              <SelectItem value="pending">Payment Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Payment Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        <div className="flex flex-wrap gap-2">
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter("all")}>
              Status: {statusFilter} ×
            </Badge>
          )}
          {paymentStatusFilter !== "all" && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setPaymentStatusFilter("all")}>
              Payment: {paymentStatusFilter} ×
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery("")}>
              Search: "{searchQuery}" ×
            </Badge>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {(orders as any)?.map?.((order: any) => (
          <AdminOrderCard key={order.orderId} order={order} onOrderUpdated={refetch} />
        ))}
      </div>

      {/* Pagination */}
      {(orders as any)?.length === limit && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}