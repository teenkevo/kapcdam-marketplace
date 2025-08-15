"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2Icon,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { OrderItem } from "./order-item";
import { type OrderResponse } from "@/features/orders/schema";
import { CustomerOrderCancelDialog } from "./customer-order-cancel-dialog";

type Props = {
  order: OrderResponse;
};

function getStatusConfig(status: string, paymentStatus: string, paymentMethod?: string) {
  // Special handling for COD orders - show order status instead of payment status
  if (paymentMethod === "cod" && paymentStatus === "pending") {
    return {
      color: "bg-blue-100 text-blue-800",
      icon: CheckCircle,
      label: "Order Received",
    };
  }
  
  if (paymentStatus === "pending" || paymentStatus === "failed") {
    return {
      color:
        paymentStatus === "failed"
          ? "bg-red-100 text-red-800"
          : "bg-orange-100 text-orange-800",
      icon: paymentStatus === "failed" ? AlertTriangle : Clock,
      label: paymentStatus === "failed" ? "Payment Failed" : "Payment Pending",
    };
  }

  switch (status) {
    case "pending":
      return {
        color: "bg-orange-100 text-orange-800",
        icon: Clock,
        label: "Pending",
      };
    case "confirmed":
      return {
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
        label: "Confirmed",
      };
    case "processing":
      return {
        color: "bg-yellow-100 text-yellow-800",
        icon: CheckCircle,
        label: "Preparing",
      };
    case "ready":
      return {
        color: "bg-purple-100 text-purple-800",
        icon: CheckCircle,
        label: "Ready",
      };
    case "shipped":
      return {
        color: "bg-purple-100 text-purple-800",
        icon: CheckCircle,
        label: "Shipped",
      };
    case "delivered":
      return {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Delivered",
      };
    case "cancelled":
      return {
        color: "bg-gray-100 text-gray-800",
        icon: X,
        label: "Cancelled",
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800",
        icon: Clock,
        label: status,
      };
  }
}

export function YourOrderCard({ order }: Props) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const statusConfig = getStatusConfig(order.status, order.paymentStatus, order.paymentMethod);

  // Mutations for order actions
  const resetOrderMutation = useMutation(
    trpc.orders.resetOrderForPayment.mutationOptions({
      onSuccess: () => {
        toast.success("Redirecting to payment...");
        router.push(`/checkout/${order.orderId}`);
      },
      onError: (error) => {
        toast.error(`Failed to prepare payment: ${error.message}`);
      },
    })
  );

  const cancelOrderMutation = useMutation(
    trpc.orders.cancelPendingOrder.mutationOptions({
      onSuccess: () => {
        toast.success("Order cancelled successfully");
        queryClient.invalidateQueries(
          trpc.orders.getUserOrders.queryOptions({ limit: 20, offset: 0 })
        );
      },
      onError: (error) => {
        toast.error(`Failed to cancel order: ${error.message}`);
      },
    })
  );

  const handleCompletePayment = () => {
    resetOrderMutation.mutate({ orderId: order.orderId });
  };

  const handleCancelOrder = () => {
    cancelOrderMutation.mutate({ orderId: order.orderId });
  };

  // Determine which actions to show based on order status
  const isPendingOrFailedPayment =
    (order.paymentStatus === "pending" || order.paymentStatus === "failed") &&
    order.paymentMethod !== "cod";
  const isConfirmedNotDelivered =
    order.status === "confirmed" && !order.deliveredAt;
  const isDelivered = order.status === "delivered" || order.deliveredAt;
  const canShowItemActions = order.status === "confirmed" || isDelivered;
  const canCancelOrder = ["confirmed", "processing"].includes(order.status);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      currencyDisplay: "code",
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace("UGX", "UGX");
  };

  return (
    <Card className="overflow-hidden border rounded-xl relative">
      {/* Loading Overlay */}
      {(resetOrderMutation.isPending || cancelOrderMutation.isPending) && (
        <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="p-8 rounded-lg text-center max-w-md mx-4 flex flex-col items-center gap-4">
            <Loader2Icon className="h-10 w-10 animate-spin text-[#C5F82A]" />
            {cancelOrderMutation.isPending ? (
              <>
                <h3 className="text-lg font-semibold mb-2">
                  Cancelling order...
                </h3>
                <p className="text-sm text-gray-500">
                  Please do not close this window.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">
                  Preparing payment...
                </h3>
                <p className="text-sm text-gray-500">
                  Please do not close this window.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <CardHeader className="bg-gray-50 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Left: Order placed date and total */}
          <div className="flex gap-12 items-center">
            <div className="flex flex-col">
              <dt className="text-gray-600 font-medium tracking-wide text-xs">
                ORDER PLACED
              </dt>
              <dd className="font-semibold">
                {format(new Date(order.orderDate), "d MMMM yyyy")}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-gray-600 font-medium tracking-wide text-xs">
                TOTAL
              </dt>
              <dd className="font-semibold">{formatCurrency(order.total)}</dd>
            </div>
          </div>

          {/* Right: Order number, status, and actions */}
          <div className="flex flex-col gap-3 text-right">
            <div className="flex items-center justify-start sm:justify-end gap-2">
              <span className="text-gray-600 text-sm">
                ORDER #{order.orderNumber}
              </span>
              <Badge
                className={`${statusConfig.color} hover:bg-inherit pointer-events-none`}
              >
                {statusConfig.label}
              </Badge>
            </div>

            <div className="flex items-center gap-2 justify-end">
              {isPendingOrFailedPayment ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCompletePayment}
                    disabled={
                      resetOrderMutation.isPending ||
                      cancelOrderMutation.isPending
                    }
                    className="bg-[#C5F82A] text-black hover:bg-[#B4E729] font-semibold"
                  >
                    Complete Payment
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          resetOrderMutation.isPending ||
                          cancelOrderMutation.isPending
                        }
                      >
                        Cancel Order
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the order and cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep order</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelOrder}>
                          Yes, cancel it
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : isConfirmedNotDelivered ? (
                <div className="flex items-center gap-2">
                  <Link href={`/your-orders/order-details?orderId=${order.orderId}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Track Order
                    </Button>
                  </Link>
                  {canCancelOrder && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setShowCancelDialog(true)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href={`/your-orders/order-details?orderId=${order.orderId}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Order Details
                    </Button>
                  </Link>
                  {canCancelOrder && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setShowCancelDialog(true)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Body */}
      <CardContent className="p-4 md:p-6">
        <ul className="divide-y">
          {order.orderItems.map((item, index) => (
            <OrderItem
              key={`${item.name}-${index}`}
              item={item}
              canShowItemActions={!!canShowItemActions}
              isDelivered={!!isDelivered}
            />
          ))}
        </ul>
      </CardContent>

      {/* Customer Cancel Dialog */}
      <CustomerOrderCancelDialog
        orderId={order.orderId}
        orderNumber={order.orderNumber}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onOrderCancelled={() => {
          // Invalidate order queries to refresh the orders list
          queryClient.invalidateQueries(
            trpc.orders.getUserOrders.queryOptions({ limit: 20, offset: 0 })
          );
        }}
      />
    </Card>
  );
}
