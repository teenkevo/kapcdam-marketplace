"use client";

import { useCallback, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TriangleAlert, Clock } from "lucide-react";
import type { OrderResponse } from "@/features/orders/schema";
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

interface Props {
  orderId: string;
  mode?: "pending" | "failed";
}

export default function OrderPendingOrFailedView({ orderId, mode }: Props) {
  const trpc = useTRPC();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data: order, isLoading } = useQuery(
    trpc.orders.getOrderById.queryOptions({ orderId })
  );

  const processPaymentMutation = useMutation(
    trpc.orders.processOrderPayment.mutationOptions({
      onSuccess: (result) => {
        setIsProcessing(true);
        router.push(result.paymentUrl);
      },
      onError: (error) => {
        toast.error(`Payment processing failed: ${error.message}`);
        setIsProcessing(false);
      },
    })
  );

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

  const handleRetryPayment = useCallback(() => {
    processPaymentMutation.mutate({ orderId });
  }, [orderId, processPaymentMutation]);

  const handleCancelOrder = useCallback(() => {
    cancelOrderMutation.mutate({ orderId });
  }, [orderId, cancelOrderMutation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5F82A] mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading Order...</h3>
          <p className="text-gray-600">
            Please wait while we fetch your order details
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-10 md:py-20">
        <div className="bg-white rounded-xl shadow-sm border-2 border-dashed p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Order not found</h1>
          <p className="text-gray-600 mb-6">
            The order you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <Button
            onClick={() => router.push("/marketplace")}
            className="px-6 py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625]"
          >
            Go to shop
          </Button>
        </div>
      </div>
    );
  }

  const typedOrder = order as OrderResponse;
  const isPesapalPending =
    typedOrder.paymentMethod === "pesapal" &&
    typedOrder.paymentStatus === "pending";
  const isCOD = typedOrder.paymentMethod === "cod";
  const formattedTotal = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  })
    .format(typedOrder.total)
    .replace("UGX", "UGX");

  return (
    <div className="h-full flex-1 flex-grow flex items-center justify-center p-4">
      <div className="max-w-xl w-full mx-auto">
        {(processPaymentMutation.isPending ||
          isProcessing ||
          cancelOrderMutation.isPending ||
          isCancelling) && (
          <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-md z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md mx-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5F82A] mx-auto mb-4" />
              {isCancelling || cancelOrderMutation.isPending ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">
                    Cancelling order...
                  </h3>
                  <p className="text-gray-600 mb-1">
                    We're cancelling your order. This will permanently delete
                    it.
                  </p>
                  <p className="text-sm text-gray-500">
                    Please do not close this window.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2">
                    Processing payment...
                  </h3>
                  <p className="text-gray-600 mb-1">
                    We're preparing your payment session. You'll be redirected
                    to the payment gateway shortly.
                  </p>
                  <p className="text-sm text-gray-500">
                    Please do not close this window.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm max-w-md mx-auto border-2 border-dashed p-8 text-center">
          <div className="flex justify-center items-center mb-4">
            {mode === "failed" ? (
              <TriangleAlert className="w-10 h-10 text-red-500" />
            ) : (
              <Clock className="w-10 h-10 text-orange-500" />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {mode === "failed"
              ? "Payment failed"
              : isPesapalPending
                ? "Complete your payment"
                : "Order pending"}
          </h1>
          <p className="text-gray-700">
            Order{" "}
            <span className="font-semibold">#{typedOrder.orderNumber}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">Total: {formattedTotal}</p>
          {mode !== "failed" && isCOD && (
            <p className="text-sm text-gray-600 mt-3">
              Cash on Delivery selected. No online payment is required.
            </p>
          )}
          {isPesapalPending && (
            <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3 mx-auto max-w-md mt-4">
              Click "Continue payment" below to complete your purchase.
            </p>
          )}

          {mode !== "failed" && (
            <div className="mt-6 text-left">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Items
              </h2>
              <div className="space-y-2">
                {typedOrder.orderItems.map((item) => (
                  <div key={item._key} className="flex justify-between text-sm">
                    <span className="text-gray-800">{item.name}</span>
                    <span className="text-gray-600">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 justify-center mt-6">
            {!isCOD && (mode === "failed" || isPesapalPending) && (
              <Button
                onClick={handleRetryPayment}
                disabled={
                  processPaymentMutation.isPending ||
                  isProcessing ||
                  isCancelling ||
                  cancelOrderMutation.isPending
                }
                className="px-6 py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625] disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                {processPaymentMutation.isPending
                  ? "Processing..."
                  : mode === "failed"
                    ? "Retry payment"
                    : "Continue payment"}
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={
                    cancelOrderMutation.isPending ||
                    isCancelling ||
                    processPaymentMutation.isPending ||
                    isProcessing
                  }
                  variant="outline"
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  Cancel order
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    We don’t keep cancelled orders. This will permanently delete
                    the order and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep order</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setIsCancelling(true);
                      handleCancelOrder();
                    }}
                  >
                    Yes, cancel it
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
