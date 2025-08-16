"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { format } from "date-fns";
import { Loader2, CheckCircle, Clock, Package, Truck, MapPin, MoreHorizontal, X } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { OrderItem } from "../components/order-item";
import { OrderDetailsViewSkeleton } from "../components/order-details-view-skeleton";
import { RelatedProductsSection } from "@/features/products/ui/components/related-products-section";
import { CustomerOrderCancelDialog } from "../components/customer-order-cancel-dialog";

type Props = {
  orderId: string;
};

function getStatusConfig(status: string, paymentStatus: string) {
  // Check for cancelled status FIRST - regardless of payment status
  if (status === "CANCELLED_BY_USER" || status === "CANCELLED_BY_ADMIN") {
    return {
      color: "bg-red-100 text-red-800",
      label: status === "CANCELLED_BY_USER" ? "Cancelled" : "Cancelled by Store",
    };
  }

  if (paymentStatus === "pending" || paymentStatus === "failed") {
    return {
      color:
        paymentStatus === "failed"
          ? "bg-red-100 text-red-800"
          : "bg-orange-100 text-orange-800",
      label: paymentStatus === "failed" ? "Payment Failed" : "Payment Pending",
    };
  }

  switch (status) {
    case "PENDING_PAYMENT":
      return {
        color: "bg-orange-100 text-orange-800",
        label: "Waiting for Payment",
      };
    case "FAILED_PAYMENT":
      return {
        color: "bg-red-100 text-red-800",
        label: "Payment Failed",
      };
    case "PROCESSING":
      return {
        color: "bg-blue-100 text-blue-800",
        label: "Order Confirmed",
      };
    case "READY_FOR_DELIVERY":
      return {
        color: "bg-purple-100 text-purple-800",
        label: "Ready for Pickup",
      };
    case "OUT_FOR_DELIVERY":
      return {
        color: "bg-indigo-100 text-indigo-800",
        label: "Out for Delivery",
      };
    case "DELIVERED":
      return {
        color: "bg-green-100 text-green-800",
        label: "Delivered",
      };
    case "CANCELLED_BY_USER":
      return {
        color: "bg-gray-100 text-gray-800",
        label: "Cancelled",
      };
    case "CANCELLED_BY_ADMIN":
      return {
        color: "bg-gray-100 text-gray-800",
        label: "Cancelled by Store",
      };
    case "REFUND_PENDING":
      return {
        color: "bg-yellow-100 text-yellow-800",
        label: "Refund Processing",
      };
    case "REFUNDED":
      return {
        color: "bg-green-100 text-green-800",
        label: "Refunded",
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800",
        label: status,
      };
  }
}

function getTrackingSteps(paymentStatus: string, orderStatus: string, paymentMethod?: string, deliveryMethod?: string) {
  // COD orders get special treatment
  if (paymentMethod === "cod") {
    return getCODTrackingSteps(orderStatus, deliveryMethod || "local_delivery");
  }

  // Always show all possible steps
  const allSteps = [
    {
      icon: CheckCircle,
      label: "Payment received",
      step: "payment",
    },
    {
      icon: Package,
      label: "Preparing",
      step: "preparing",
    },
    {
      icon: Truck,
      label: "Shipped",
      step: "shipped",
    },
    {
      icon: CheckCircle,
      label: "Delivered",
      step: "delivered",
    },
  ];

  // Handle special cases first
  if (paymentStatus === "pending") {
    return [
      {
        icon: Clock,
        label: "Payment pending",
        status: "current",
      },
      ...allSteps
        .slice(1)
        .map((step) => ({ ...step, status: "pending" as const })),
    ];
  }

  if (paymentStatus === "failed") {
    return [
      {
        icon: Clock,
        label: "Payment failed",
        status: "current",
      },
      ...allSteps
        .slice(1)
        .map((step) => ({ ...step, status: "pending" as const })),
    ];
  }

  if (orderStatus === "CANCELLED_BY_USER" || orderStatus === "CANCELLED_BY_ADMIN") {
    return [
      {
        icon: Clock,
        label: orderStatus === "CANCELLED_BY_USER" ? "Cancelled" : "Cancelled by Store",
        status: "current",
      },
    ];
  }

  if (orderStatus === "REFUND_PENDING") {
    return [
      {
        icon: Clock,
        label: "Refund Processing",
        status: "current",
      },
    ];
  }

  if (orderStatus === "REFUNDED") {
    return [
      {
        icon: CheckCircle,
        label: "Refunded",
        status: "completed",
      },
    ];
  }

  // For paid orders, determine status of each step
  return allSteps.map((step, index) => {
    if (step.step === "payment" && paymentStatus === "paid") {
      return { ...step, status: "completed" as const };
    }

    if (step.step === "preparing") {
      if (["PROCESSING"].includes(orderStatus)) {
        return { ...step, status: "current" as const };
      } else if (
        ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderStatus)
      ) {
        return { ...step, status: "completed" as const };
      }
    }

    if (step.step === "shipped") {
      if (["READY_FOR_DELIVERY"].includes(orderStatus)) {
        return { ...step, status: "current" as const };
      } else if (["OUT_FOR_DELIVERY", "DELIVERED"].includes(orderStatus)) {
        return { ...step, status: "completed" as const };
      }
    }

    if (step.step === "delivered") {
      if (orderStatus === "DELIVERED") {
        return { ...step, status: "completed" as const };
      }
    }

    return { ...step, status: "pending" as const };
  });
}

function getCODTrackingSteps(orderStatus: string, deliveryMethod: string) {
  const isPickup = deliveryMethod === "pickup";
  
  const steps = [
    {
      icon: CheckCircle,
      label: "Order received",
      step: "confirmed",
    },
    {
      icon: Package,
      label: "Preparing",
      step: "preparing",
    },
    {
      icon: isPickup ? MapPin : Truck,
      label: isPickup ? "Ready for pickup" : "Out for delivery",
      step: isPickup ? "ready" : "shipped",
    },
    {
      icon: CheckCircle,
      label: isPickup ? "Collected & Paid" : "Delivered & Paid",
      step: "delivered",
    },
  ];

  // Map each step to its status based on order status
  return steps.map((step) => {
    let status: "completed" | "current" | "pending" = "pending";

    switch (step.step) {
      case "confirmed":
        // For PROCESSING orders, show "Order received" as COMPLETED so only preparing is current
        if (orderStatus === "PROCESSING") status = "completed";
        else if (["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderStatus)) status = "completed";
        else status = "pending";
        break;
      case "preparing":
        if (orderStatus === "PROCESSING") status = "current";
        else if (["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderStatus)) status = "completed";
        else status = "pending";
        break;
      case "ready": // for pickup
        if (orderStatus === "READY_FOR_DELIVERY") status = "current";
        else if (["DELIVERED"].includes(orderStatus)) status = "completed";
        break;
      case "shipped": // for delivery
        if (["OUT_FOR_DELIVERY"].includes(orderStatus)) status = "current";
        else if (["DELIVERED"].includes(orderStatus)) status = "completed";
        break;
      case "delivered":
        status = orderStatus === "DELIVERED" ? "completed" : "pending";
        break;
    }

    return { ...step, status };
  });
}

export function OrderDetailsView({ orderId }: Props) {
  const trpc = useTRPC();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    ...trpc.orders.getOrderById.queryOptions({ orderId }),
  });

  if (isLoading) {
    return <OrderDetailsViewSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <p className="text-muted-foreground">
          The order you're looking for doesn't exist or you don't have
          permission to view it.
        </p>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status, order.paymentStatus);
  const trackingSteps = getTrackingSteps(order.paymentStatus, order.status, order.paymentMethod, order.deliveryMethod);

  // Order item action logic - match YourOrderCard exactly
  const isDelivered = order.status === "DELIVERED";
  const canShowItemActions = order.status === "PROCESSING" || isDelivered;

  // Extract product IDs for related products
  const productIds = order.orderItems
    .filter((item) => item.type === "product" && item.productId)
    .map((item) => item.productId!)
    .filter(Boolean);

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
    <div>
      {/* Order info above card */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex gap-8 items-center">
          <div className="flex flex-col">
            <h1 className=" text-gray-900">
              ORDER{" "}
              <span className="text-base font-semibold">
                #{order.orderNumber}
              </span>{" "}
              placed on{" "}
              <span className="text-base font-semibold">
                {format(new Date(order.orderDate), "d MMMM yyyy")}
              </span>
            </h1>
            {/* Status Badge */}
            <div className="mt-2">
              <Badge
                className={`${statusConfig.color} hover:bg-inherit pointer-events-none font-medium text-sm shadow-none`}
              >
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Order Actions Dropdown */}
        {["PROCESSING", "READY_FOR_DELIVERY"].includes(order.status) && (
          <div className="flex items-center">
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
          </div>
        )}
      </div>

      <Card className="overflow-hidden border rounded-xl">
        {/* Header */}
        <CardHeader className="bg-gray-50 p-4 md:p-6">
          {/* Two column layout */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column - Ship to and Payment Methods */}
            <div className="flex-1 flex items-start gap-12">
              <div>
                <h3 className="font-semibold text-base mb-3">Ship to</h3>
                <div className="text-sm">
                  <div className="font-medium">
                    {order.billingAddress.fullName}
                  </div>
                  <div className="text-gray-600">
                    {order.billingAddress.address}
                  </div>
                  <div className="text-gray-600">
                    {order.billingAddress.city}
                  </div>
                  <div className="text-gray-600">
                    {order.billingAddress.phone}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-3">
                  Payment Methods
                </h3>
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <span>
                      {order.paymentMethod === "pesapal"
                        ? "PesaPal"
                        : "Cash on Delivery"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Order Summary */}
            <div className="flex-1 max-w-sm">
              <h3 className="font-semibold text-base mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Item(s) Subtotal:</span>
                  <span>{formatCurrency(order.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping & Handling:</span>
                  <span>{formatCurrency(order.shippingCost || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>
                    {formatCurrency(
                      (order.subtotal || 0) + (order.shippingCost || 0)
                    )}
                  </span>
                </div>
                {order.orderLevelDiscount && (
                  <div className="flex justify-between text-green-600">
                    <span>Promotion applied:</span>
                    <span>
                      -{formatCurrency(order.orderLevelDiscount.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Steps */}
          {trackingSteps.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center gap-6 flex-wrap">
                {trackingSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          step.status === "completed" && "text-gray-800",
                          step.status === "current" && "text-blue-600",
                          step.status === "pending" && "text-gray-400"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          step.status === "completed" && "text-gray-800",
                          step.status === "current" &&
                            "text-blue-600 font-semibold",
                          step.status === "pending" && "text-gray-400"
                        )}
                      >
                        {step.label}
                      </span>
                      {index < trackingSteps.length - 1 && (
                        <div className="w-8 h-px bg-gray-300 ml-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardHeader>

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
      </Card>

      {/* Related Products Section */}
      <RelatedProductsSection
        productIds={productIds}
        title={
          productIds.length > 0 
            ? "Customers who bought these items also bought" 
            : "You might also like"
        }
        limit={4}
        className="px-0 pt-8"
      />

      {/* Customer Cancel Dialog */}
      <CustomerOrderCancelDialog
        orderId={order.orderId}
        orderNumber={order.orderNumber}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onOrderCancelled={() => {
          // Refresh the order data
          window.location.reload();
        }}
      />
    </div>
  );
}
