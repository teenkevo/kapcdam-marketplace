"use client";

import { CheckCircle, Clock, Package, Truck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type TrackingStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "completed" | "current" | "pending";
};

type Props = {
  paymentStatus: string;
  orderStatus: string;
  className?: string;
};

function getTrackingSteps(
  paymentStatus: string,
  orderStatus: string
): TrackingStep[] {
  const steps: TrackingStep[] = [
    {
      id: "payment",
      title: "Payment Received",
      description: "Your payment has been processed successfully",
      icon: CheckCircle,
      status: "pending",
    },
    {
      id: "preparing",
      title: "Preparing",
      description: "We're preparing your order for shipment",
      icon: Package,
      status: "pending",
    },
    {
      id: "shipped",
      title: "Shipped",
      description: "Your order is on its way",
      icon: Truck,
      status: "pending",
    },
    {
      id: "delivered",
      title: "Delivered",
      description: "Your order has been delivered",
      icon: MapPin,
      status: "pending",
    },
  ];

  // Set payment step status
  if (paymentStatus === "paid") {
    steps[0].status = "completed";
  } else if (paymentStatus === "pending") {
    steps[0].status = "current";
    steps[0].title = "Payment Pending";
    steps[0].description = "Waiting for payment confirmation";
    steps[0].icon = Clock;
  } else if (paymentStatus === "failed") {
    steps[0].status = "current";
    steps[0].title = "Payment Failed";
    steps[0].description = "Payment was not successful";
    steps[0].icon = Clock;
    return steps; // Don't process further steps if payment failed
  }

  // Set order status steps based on order status
  if (paymentStatus === "paid") {
    switch (orderStatus) {
      case "pending":
        // Payment received, but order not yet confirmed
        steps[1].status = "current";
        break;
      case "confirmed":
        steps[1].status = "current";
        steps[1].title = "Preparing";
        steps[1].description = "Your order is confirmed and being prepared";
        break;
      case "processing":
        steps[1].status = "completed";
        steps[2].status = "current";
        steps[2].title = "Processing";
        steps[2].description = "Your order is being processed";
        break;
      case "ready":
        steps[1].status = "completed";
        steps[2].status = "current";
        steps[2].title = "Ready for Pickup/Delivery";
        steps[2].description = "Your order is ready";
        break;
      case "shipped":
        steps[1].status = "completed";
        steps[2].status = "completed";
        steps[3].status = "current";
        break;
      case "delivered":
        steps[1].status = "completed";
        steps[2].status = "completed";
        steps[3].status = "completed";
        break;
      case "cancelled":
        steps[1].status = "current";
        steps[1].title = "Cancelled";
        steps[1].description = "Your order has been cancelled";
        break;
    }
  }

  return steps;
}

export function OrderTracking({
  paymentStatus,
  orderStatus,
  className,
}: Props) {
  const steps = getTrackingSteps(paymentStatus, orderStatus);

  return (
    <div className={cn("bg-white rounded-lg border p-6", className)}>
      <h3 className="text-lg font-semibold mb-6">Order Tracking</h3>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2",
                    step.status === "completed" &&
                      "bg-green-100 border-green-500 text-green-600",
                    step.status === "current" &&
                      "bg-blue-100 border-blue-500 text-blue-600",
                    step.status === "pending" &&
                      "bg-gray-100 border-gray-300 text-gray-400"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "font-medium",
                      step.status === "completed" && "text-green-700",
                      step.status === "current" && "text-blue-700",
                      step.status === "pending" && "text-gray-500"
                    )}
                  >
                    {step.title}
                  </div>
                  <div
                    className={cn(
                      "text-sm mt-1",
                      step.status === "completed" && "text-green-600",
                      step.status === "current" && "text-blue-600",
                      step.status === "pending" && "text-gray-400"
                    )}
                  >
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-5 top-10 w-0.5 h-8 -translate-x-0.5",
                    step.status === "completed" && "bg-green-300",
                    step.status === "current" && "bg-blue-300",
                    step.status === "pending" && "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
