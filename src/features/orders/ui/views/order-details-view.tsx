"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { format } from "date-fns";
import { Loader2, CheckCircle, Clock, Package, Truck } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OrderItem } from "../components/order-item";
import { OrderDetailsViewSkeleton } from "../components/order-details-view-skeleton";
import { RelatedProductsSection } from "@/features/products/ui/components/related-products-section";

type Props = {
  orderId: string;
};

function getStatusConfig(status: string, paymentStatus: string) {
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
    case "pending":
      return {
        color: "bg-orange-100 text-orange-800",
        label: "Pending",
      };
    case "confirmed":
      return {
        color: "bg-blue-100 text-blue-800",
        label: "Confirmed",
      };
    case "processing":
      return {
        color: "bg-blue-100 text-blue-800",
        label: "Processing",
      };
    case "ready":
      return {
        color: "bg-purple-100 text-purple-800",
        label: "Ready",
      };
    case "shipped":
      return {
        color: "bg-indigo-100 text-indigo-800",
        label: "Shipped",
      };
    case "delivered":
      return {
        color: "bg-green-100 text-green-800",
        label: "Delivered",
      };
    case "cancelled":
      return {
        color: "bg-red-100 text-red-800",
        label: "Cancelled",
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800",
        label: status,
      };
  }
}

function getTrackingSteps(paymentStatus: string, orderStatus: string) {
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

  if (orderStatus === "cancelled") {
    return [
      {
        icon: Clock,
        label: "Cancelled",
        status: "current",
      },
    ];
  }

  // For paid orders, determine status of each step
  return allSteps.map((step, index) => {
    if (step.step === "payment" && paymentStatus === "paid") {
      return { ...step, status: "completed" as const };
    }

    if (step.step === "preparing") {
      if (["pending", "confirmed"].includes(orderStatus)) {
        return { ...step, status: "current" as const };
      } else if (
        ["processing", "ready", "shipped", "delivered"].includes(orderStatus)
      ) {
        return { ...step, status: "completed" as const };
      }
    }

    if (step.step === "shipped") {
      if (["processing", "ready"].includes(orderStatus)) {
        return { ...step, status: "current" as const };
      } else if (["shipped", "delivered"].includes(orderStatus)) {
        return { ...step, status: "completed" as const };
      }
    }

    if (step.step === "delivered") {
      if (orderStatus === "delivered") {
        return { ...step, status: "completed" as const };
      }
    }

    return { ...step, status: "pending" as const };
  });
}

export function OrderDetailsView({ orderId }: Props) {
  const trpc = useTRPC();

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
  const trackingSteps = getTrackingSteps(order.paymentStatus, order.status);

  // Order item action logic - match YourOrderCard exactly
  const isDelivered = order.status === "delivered";
  const canShowItemActions = order.status === "confirmed" || isDelivered;

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
          </div>
        </div>
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
    </div>
  );
}
