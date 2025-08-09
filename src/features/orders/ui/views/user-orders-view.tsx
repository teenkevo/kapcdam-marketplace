"use client";
import { useMemo, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/features/cart/ui/components/add-to-cart-btn";
import { WriteReviewButton } from "@/features/reviews/ui/components/write-review-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type FilterRange =
  | "this_month"
  | "last_3_months"
  | "this_year"
  | "custom"
  | "all";

export default function UserOrdersView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<FilterRange>("this_month");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const ordersQuery = useQuery(
    trpc.orders.getUserOrders.queryOptions({ limit: 50, offset: 0 })
  );

  const ordersCountQuery = useQuery(
    trpc.orders.getUserOrdersCount.queryOptions()
  );

  const processPayment = useMutation(
    trpc.orders.processOrderPayment.mutationOptions({
      onSuccess: (res) => {
        setIsProcessing(true);
        window.location.href = res.paymentUrl;
      },
      onError: () => setIsProcessing(false),
    })
  );
  const cancelOrder = useMutation(
    trpc.orders.cancelPendingOrder.mutationOptions({
      onSuccess: () => {
        setIsCancelling(false);
        queryClient.invalidateQueries({
          queryKey: ["orders", "getUserOrders"],
        });
        queryClient.invalidateQueries({
          queryKey: ["orders", "getUserOrdersCount"],
        });
      },
      onError: () => setIsCancelling(false),
    })
  );

  const filtered = useMemo(() => {
    const list = ordersQuery.data;
    if (!list || !Array.isArray(list)) return [];

    const now = new Date();
    let from: Date | null = null;
    if (range === "this_month")
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    if (range === "last_3_months")
      from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    if (range === "this_year") from = new Date(now.getFullYear(), 0, 1);
    if (range === "custom" && customFrom) from = new Date(customFrom);
    const to = range === "custom" && customTo ? new Date(customTo) : now;

    return list.filter((o: any) => {
      const dateOk = from
        ? new Date(o.orderDate) >= from && new Date(o.orderDate) <= to
        : true;
      const s = search.toLowerCase().trim();
      const textOk = s
        ? o.orderNumber?.toLowerCase().includes(s) ||
          (o.orderItems || []).some((it: any) =>
            it.name?.toLowerCase().includes(s)
          )
        : true;
      return dateOk && textOk;
    });
  }, [ordersQuery.data, range, customFrom, customTo, search]);

  // Show loading state
  if (ordersQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5F82A] mx-auto mb-3" />
          <p className="text-gray-600">Loading your orders...</p>
          <p className="text-sm text-gray-500 mt-2">
            Debug: Query is in loading state
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (ordersQuery.isError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Failed to load orders
          </h3>
          <p className="text-red-600 mb-4">
            {ordersQuery.error?.message || "Unknown error"}
          </p>
          <button
            onClick={() => ordersQuery.refetch()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-red-700">
              Debug Info
            </summary>
            <pre className="text-xs mt-2 text-red-600 overflow-auto">
              {JSON.stringify(ordersQuery.error, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug info */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
        <strong>Debug Info:</strong> Query Status: {ordersQuery.status}, Data
        Length: {ordersQuery.data?.length || 0}, Filtered Length:{" "}
        {filtered.length}, Orders Count:{" "}
        {ordersCountQuery.data?.count || "loading..."}
      </div>

      {(processPayment.isPending ||
        isProcessing ||
        cancelOrder.isPending ||
        isCancelling) && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow text-center max-w-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5F82A] mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">
              {isCancelling || cancelOrder.isPending
                ? "Cancelling order..."
                : "Processing payment..."}
            </h3>
            <p className="text-sm text-gray-600">
              Please do not close this window.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <Input
          placeholder="Search by order number or item"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:max-w-sm"
        />
        <div className="flex gap-3 items-center">
          <Select value={range} onValueChange={(v: FilterRange) => setRange(v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This month</SelectItem>
              <SelectItem value="last_3_months">Last 3 months</SelectItem>
              <SelectItem value="this_year">This year</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          {range === "custom" && (
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <span>to</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 max-h-[70vh] overflow-auto pr-1">
        {filtered.map((o: any) => {
          const isPending =
            o.paymentStatus === "pending" && o.paymentMethod === "pesapal";
          const isFailed = o.paymentStatus === "failed";
          const isCOD = o.paymentMethod === "cod";
          const isConfirmed =
            o.status === "confirmed" || o.paymentStatus === "paid";

          return (
            <div key={o._id} className="bg-white border rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">Order #{o.orderNumber}</div>
                  <div className="text-sm text-gray-600">
                    Total: UGX {o.total.toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isPending && (
                    <>
                      <Button
                        onClick={() =>
                          processPayment.mutate({ orderId: o._id })
                        }
                        disabled={processPayment.isPending || isCancelling}
                        className="bg-[#C5F82A] text-black hover:bg-[#B8E625]"
                      >
                        Continue payment
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            disabled={
                              cancelOrder.isPending || processPayment.isPending
                            }
                          >
                            Cancel order
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Cancel this order?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              We don't keep cancelled orders. This will
                              permanently delete the order and cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep order</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                setIsCancelling(true);
                                cancelOrder.mutate({ orderId: o._id });
                              }}
                            >
                              Yes, cancel it
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                  {isFailed && !isCOD && (
                    <>
                      <Button
                        onClick={() =>
                          processPayment.mutate({ orderId: o._id })
                        }
                        disabled={processPayment.isPending || isCancelling}
                        className="bg-[#C5F82A] text-black hover:bg-[#B8E625]"
                      >
                        Try payment again
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            disabled={
                              cancelOrder.isPending || processPayment.isPending
                            }
                          >
                            Cancel order
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Cancel this order?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              We don't keep cancelled orders. This will
                              permanently delete the order and cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep order</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                setIsCancelling(true);
                                cancelOrder.mutate({ orderId: o._id });
                              }}
                            >
                              Yes, cancel it
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>

              {/* Collapsible details */}
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-gray-700">
                  {isConfirmed ? "Track status and view items" : "View items"}
                </summary>
                <div className="mt-3 space-y-2">
                  {isConfirmed && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="h-2 w-2 rounded-full bg-green-500" />{" "}
                      Preparing → Shipped → Delivered
                    </div>
                  )}
                  <div className="space-y-1">
                    {(o.orderItems || []).map((it: any, idx: number) => {
                      const canBuyAgain =
                        (it.type === "product" && it.productId) ||
                        (it.type === "course" && it.courseId);
                      const cartItem =
                        it.type === "product"
                          ? {
                              type: "product",
                              productId: it.productId,
                              selectedVariantSku: it.variantSku,
                            }
                          : { type: "course", courseId: it.courseId };
                      return (
                        <div
                          key={`${it._key || idx}`}
                          className="flex flex-col gap-2 border rounded-md p-2"
                        >
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-800">{it.name}</span>
                            <span className="text-gray-600">
                              ×{it.quantity}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {canBuyAgain && (
                              <AddToCartButton
                                // @ts-expect-error cart types allow either productId or courseId
                                product={{ ...cartItem, quantity: 1 }}
                                quantity={1}
                                label="Buy again"
                              />
                            )}
                            {it.type === "product" && it.productId && (
                              <WriteReviewButton productId={it.productId} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-gray-600 py-12">
            <p className="mb-2">No orders found for the selected filters.</p>
            <div className="text-sm text-gray-500">
              <p>Debug Info:</p>
              <p>Raw data length: {ordersQuery.data?.length || 0}</p>
              <p>Current filter: {range}</p>
              <p>Search term: "{search}"</p>
              {ordersQuery.data?.length === 0 && (
                <p className="text-orange-600 font-medium">
                  No orders exist in database
                </p>
              )}
              {(ordersQuery.data?.length || 0) > 0 && filtered.length === 0 && (
                <p className="text-blue-600 font-medium">
                  Orders exist but filtered out
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}