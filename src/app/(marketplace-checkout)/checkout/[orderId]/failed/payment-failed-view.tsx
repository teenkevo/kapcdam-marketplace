"use client";

import { useState, useCallback } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft, MessageCircle } from "lucide-react";

interface PaymentFailedViewProps {
  orderId: string;
}

export default function PaymentFailedView({ orderId }: PaymentFailedViewProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  // Fetch order details
  const { data: order, isLoading: isOrderLoading } = useQuery(
    trpc.orders.getOrderById.queryOptions({ orderId })
  );

  // Payment retry mutation
  const retryPaymentMutation = useMutation(
    trpc.orders.processOrderPayment.mutationOptions({
      onSuccess: (result) => {
        toast.success("Redirecting to payment...");
        window.location.href = result.paymentUrl;
      },
      onError: (error) => {
        setIsRetrying(false);
        toast.error(`Payment retry failed: ${error.message}`);
      },
    })
  );

  // Cancel order mutation
  const cancelOrderMutation = useMutation(
    trpc.orders.cancelPendingOrder.mutationOptions({
      onSuccess: () => {
        toast.success("Order cancelled successfully");
        router.push("/checkout");
      },
      onError: (error) => {
        toast.error(`Failed to cancel order: ${error.message}`);
      },
    })
  );

  const handleRetryPayment = useCallback(() => {
    if (!order || typeof order !== 'object' || !('_id' in order)) return;
    
    setIsRetrying(true);
    retryPaymentMutation.mutate({ orderId: (order as any)._id });
  }, [order, retryPaymentMutation]);

  const handleCancelOrder = useCallback(() => {
    if (!order || typeof order !== 'object' || !('_id' in order)) return;
    cancelOrderMutation.mutate({ orderId: (order as any)._id });
  }, [order, cancelOrderMutation]);

  const handleBackToCheckout = useCallback(() => {
    router.push("/checkout");
  }, [router]);

  if (isOrderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5F82A] mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Loading Order...</h3>
          <p className="text-gray-600">Please wait while we fetch your order details</p>
        </div>
      </div>
    );
  }

  if (!order || typeof order !== 'object') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-8">
            The order you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button
            onClick={handleBackToCheckout}
            className="px-8 py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625]"
          >
            Back to Checkout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-2xl w-full">
        {/* Processing Overlay */}
        {(isRetrying || retryPaymentMutation.isPending) && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5F82A] mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Processing Payment...</h3>
              <p className="text-gray-600">
                We're preparing your payment session. You'll be redirected to the payment gateway shortly.
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-lg text-gray-600 mb-2">
              Order #{(order as any).orderNumber}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-red-800">
                Your payment could not be processed. This might be due to insufficient funds, 
                network issues, or payment gateway problems. You can try again or contact support.
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              {(order as any).orderItems?.map((item: any) => (
                <div
                  key={item._id}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div>
                    <p className="font-medium">
                      {item.product?.title ||
                        item.course?.title ||
                        item.variantSnapshot?.title ||
                        item.courseSnapshot?.title}
                    </p>
                    {item.variantSnapshot?.variantInfo && (
                      <p className="text-sm text-gray-500">
                        {item.variantSnapshot.variantInfo}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
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
                    -UGX {(order as any).orderLevelDiscount.discountAmount.toLocaleString()}
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
            <Button
              onClick={handleRetryPayment}
              disabled={isRetrying || retryPaymentMutation.isPending}
              className="px-8 py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isRetrying || retryPaymentMutation.isPending ? "Processing..." : "Retry Payment"}
            </Button>

            <Button
              onClick={handleCancelOrder}
              disabled={cancelOrderMutation.isPending}
              variant="outline"
              className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelOrderMutation.isPending ? "Cancelling..." : "Cancel Order"}
            </Button>

            <Button
              onClick={handleBackToCheckout}
              variant="ghost"
              className="px-8 py-3 text-gray-600 font-semibold rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Checkout
            </Button>
          </div>

          {/* Support Information */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">Need help with your payment?</p>
            <Button
              variant="ghost"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}