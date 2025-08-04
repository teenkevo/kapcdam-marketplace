"use client";

import { useState, useEffect, useCallback } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface OrderCheckoutViewProps {
  orderId: string;
}

export default function OrderCheckoutView({ orderId }: OrderCheckoutViewProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isReturnVisit, setIsReturnVisit] = useState(false);
  const [showUI, setShowUI] = useState(false);

  // Fetch order details
  const { data: order, isLoading: isOrderLoading } = useQuery(
    trpc.orders.getOrderById.queryOptions({ orderId })
  );

  // Payment processing mutation
  const processPaymentMutation = useMutation(
    trpc.orders.processOrderPayment.mutationOptions({
      onSuccess: (result) => {
        // Redirect to Pesapal payment page
        window.location.href = result.paymentUrl;
      },
      onError: (error) => {
        setIsProcessingPayment(false);
        toast.error(`Payment processing failed: ${error.message}`);
      },
    })
  );

  // Cancel order mutation
  const cancelOrderMutation = useMutation(
    trpc.orders.cancelPendingOrder.mutationOptions({
      onSuccess: () => {
        toast.success("Order cancelled successfully");
        router.push("/marketplace");
      },
      onError: (error) => {
        toast.error(`Failed to cancel order: ${error.message}`);
      },
    })
  );

  const handleInitiatePayment = useCallback(() => {
    if (!order || typeof order !== "object" || !("_id" in order)) return;

    setIsProcessingPayment(true);
    processPaymentMutation.mutate({ orderId: (order as any)._id });
  }, [order, processPaymentMutation]);

  const handleRetryPayment = useCallback(() => {
    handleInitiatePayment();
  }, [handleInitiatePayment]);

  const handleCancelOrder = useCallback(() => {
    if (!order || typeof order !== "object" || !("_id" in order)) return;
    cancelOrderMutation.mutate({ orderId: (order as any)._id });
  }, [order, cancelOrderMutation]);

  useEffect(() => {
    if (
      order &&
      typeof order === "object" &&
      "paymentStatus" in order &&
      "paymentMethod" in order
    ) {
      const orderData = order as any;
      if (
        orderData.paymentStatus === "pending" &&
        orderData.paymentMethod === "pesapal"
      ) {
        const sessionKey = `payment-initiated-${orderId}`;
        const hasInitiated = sessionStorage.getItem(sessionKey);

        if (!hasInitiated) {
          // First visit - set session key and immediately initiate payment
          sessionStorage.setItem(sessionKey, "true");
          setIsReturnVisit(false);
          setShowUI(false);
          handleInitiatePayment(); 
        } else {
          
          setIsReturnVisit(true);
          setShowUI(true);
        }
      } else {
        // Not a pending Pesapal order, show UI
        setShowUI(true);
      }
    }
  }, [order, orderId, handleInitiatePayment]);

  // Redirect based on order status
  useEffect(() => {
    if (
      order &&
      typeof order === "object" &&
      "paymentStatus" in order &&
      "paymentMethod" in order
    ) {
      const orderData = order as any; 
      if (orderData.paymentStatus === "paid") {
        router.push(`/checkout/${orderId}/success`);
      } else if (orderData.paymentStatus === "failed") {
        router.push(`/checkout/${orderId}/failed`);
      } else if (
        orderData.paymentMethod === "cod" &&
        orderData.paymentStatus === "pending"
      ) {
        router.push(`/checkout/${orderId}/success`);
      }
    }
  }, [order, orderId, router]);

  if (isOrderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5F82A] mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Loading Order...</h3>
          <p className="text-gray-600">
            Please wait while we fetch your order details
          </p>
        </div>
      </div>
    );
  }

  // Show processing screen for first-time visits (immediate redirect to payment)
  if (!showUI && order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5F82A] mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Processing Payment...</h3>
          <p className="text-gray-600 mb-1">
            We're preparing your payment session. You'll be redirected to the payment gateway shortly.
          </p>
          <p className="text-sm text-gray-500">
            Please do not close this window.
          </p>
        </div>
      </div>
    );
  }

  if (!order || typeof order !== "object") {
    return (
      <div className="max-w-4xl mx-auto py-10 md:py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
        <p className="text-lg text-muted-foreground mb-8">
          The order you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Button
          onClick={() => router.push("/marketplace")}
          className="px-8 py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625]"
        >
          Go to Shop
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex-grow flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Processing Overlay */}
        {(isProcessingPayment || processPaymentMutation.isPending) && (
          <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-md z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md mx-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5F82A] mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">
                Processing Payment...
              </h3>
              <p className="text-gray-600 mb-1">
                We're preparing your payment session. You'll be redirected to the payment gateway shortly.
              </p>
              <p className="text-sm text-gray-500">
                Please do not close this window.
              </p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">
            {(order as any).paymentStatus === "pending" &&
            (order as any).paymentMethod === "pesapal"
              ? "Complete Your Payment"
              : "Order Processing"}
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Order #{(order as any).orderNumber}
          </p>
          {isReturnVisit &&
            (order as any).paymentStatus === "pending" &&
            (order as any).paymentMethod === "pesapal" && (
              <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3 mx-auto max-w-md">
                Click "Continue Payment" below to complete your purchase.
              </p>
            )}
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-dashed rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

          <div className="space-y-3 mb-6">
            {(order as any).orderItems?.map((item: any) => (
              <div
                key={item._id}
                className="flex justify-between items-center py-2 border-b"
              >
                <div>
                  <p className="font-medium">
                    {item.product?.title ||
                      item.course?.title ||
                      item.variantSnapshot?.title ||
                      item.courseSnapshot?.title}
                  </p>
                  {item.variantSnapshot?.variantInfo && (
                    <p className="text-sm text-muted-foreground">
                      {item.variantSnapshot.variantInfo}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <p className="font-medium">
                  UGX {item.lineTotal.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>UGX {(order as any).subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>UGX {(order as any).shippingCost.toLocaleString()}</span>
            </div>
            {(order as any).orderLevelDiscount && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>
                  -UGX{" "}
                  {(
                    order as any
                  ).orderLevelDiscount.discountAmount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>UGX {(order as any).total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {(order as any).paymentStatus === "pending" &&
            (order as any).paymentMethod === "pesapal" && (
              <Button
                onClick={handleRetryPayment}
                disabled={
                  isProcessingPayment || processPaymentMutation.isPending
                }
                className="px-8 py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment || processPaymentMutation.isPending
                  ? "Processing..."
                  : "Continue Payment"}
              </Button>
            )}

          <Button
            onClick={handleCancelOrder}
            disabled={cancelOrderMutation.isPending}
            variant="outline"
            className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelOrderMutation.isPending ? "Cancelling..." : "Cancel Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
