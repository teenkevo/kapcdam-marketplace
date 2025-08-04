"use client";

import { useState } from "react";

import { OrderSummary } from "../components/order-summary";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CheckoutForm from "../components/CheckoutForm";
import { useCheckoutForm } from "../../hooks/use-checkout-form";
import {
  CheckoutFormSkeleton,
  OrderSummarySkeleton,
} from "../components/checkout-skeleton";

export default function CheckoutView() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Check for pending order first (as per lifecycle Phase 4, Scenario C)
  const { data: pendingOrderData, isLoading: isPendingOrderLoading } = useQuery(
    trpc.orders.getPendingOrder.queryOptions()
  );
  
  const { data: userCart, isLoading: isCartLoading } = useQuery(
    trpc.cart.getUserCart.queryOptions()
  );
  const {
    formState,
    handleFormValidChange,
    handleFormDataChange,
    handleShippingAddressChange,
  } = useCheckoutForm();

  // State for applied coupon
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    originalPercentage: number;
  } | null>(null);

  // State for order processing
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Create order mutation
  const createOrderMutation = useMutation(
    trpc.orders.createOrder.mutationOptions({
      onSuccess: async (result) => {
        toast.success(`Order ${result.orderNumber} created successfully!`);

        // Comprehensive cache invalidation for cart-related queries
        try {
          // 1. Invalidate all cart queries
          await queryClient.invalidateQueries({ queryKey: ["cart"] });

          // 2. Remove all cart query cache to force fresh fetch
          queryClient.removeQueries({ queryKey: ["cart"] });

          // 3. Specifically invalidate getUserCart query
          await queryClient.invalidateQueries(
            trpc.cart.getUserCart.queryOptions()
          );

          // 4. Invalidate cart display data queries
          await queryClient.invalidateQueries({
            queryKey: ["cart", "getDisplayData"],
          });

        } catch (error) {
          console.error("Cache invalidation error:", error);
          // Continue with order flow even if cache invalidation fails
        }

        if (result.paymentRequired) {
          // Process payment for pesapal orders
          try {
            setIsProcessingOrder(true);
            const paymentResult = await processPaymentMutation.mutateAsync({
              orderId: result.orderId,
            });

            // Redirect to payment page
            window.location.href = paymentResult.paymentUrl;
          } catch (error: any) {
            setIsProcessingOrder(false);
            toast.error(`Payment processing failed: ${error.message}`);
            console.error("Payment processing error:", error);
          }
        } else {
          // Redirect to order confirmation for COD
          router.push(`/orders/${result.orderId}/confirmation`);
        }
      },
      onError: (error) => {
        toast.error(`Failed to create order: ${error.message}`);
        console.error("Order creation error:", error);
      },
    })
  );

  // Payment processing mutation
  const processPaymentMutation = useMutation(
    trpc.orders.processOrderPayment.mutationOptions({
      onError: (error) => {
        console.error("Payment processing mutation error:", error);
        // Error handling is done in the createOrder onSuccess
      },
    })
  );

  // Cancel pending order mutation
  const cancelPendingOrderMutation = useMutation(
    trpc.orders.cancelPendingOrder.mutationOptions({
      onSuccess: () => {
        toast.success("Order cancelled successfully");
        queryClient.invalidateQueries(trpc.orders.getPendingOrder.queryOptions());
        queryClient.invalidateQueries(trpc.cart.getUserCart.queryOptions());
      },
      onError: (error) => {
        toast.error(`Failed to cancel order: ${error.message}`);
      },
    })
  );

  // Handler for coupon changes from OrderSummary
  const handleCouponChange = (
    coupon: {
      code: string;
      discountAmount: number;
      originalPercentage: number;
    } | null
  ) => {
    setAppliedCoupon(coupon);
  };

  const handlePlaceOrder = () => {
    if (!formState.isValid || !formState.formData || !userCart) {
      toast.error("Please complete all required fields");
      return;
    }

    const { formData } = formState;

    const orderData = {
      shippingAddress: formData.selectedAddress,
      deliveryMethod: formData.deliveryMethod,
      paymentMethod: formData.paymentMethod,
      selectedDeliveryZone: formData.selectedDeliveryZone,
      appliedCoupon,
    };

    console.log("Submitting order with data:", orderData); // Debug log
    createOrderMutation.mutate(orderData);
  };

  const handleRetryPayment = () => {
    if (!pendingOrderData) return;
    
    setIsProcessingOrder(true);
    processPaymentMutation.mutate({ orderId: pendingOrderData._id }, {
      onSuccess: (result) => {
        window.location.href = result.paymentUrl;
      },
      onError: () => {
        setIsProcessingOrder(false);
      }
    });
  };

  const handleCancelOrder = () => {
    if (!pendingOrderData) return;
    cancelPendingOrderMutation.mutate({ orderId: pendingOrderData._id });
  };

  if (isPendingOrderLoading || isCartLoading) {
    return (
      <div className="max-w-7xl mx-auto py-10 md:py-16">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Checkout Form Skeleton */}
          <div>
            <CheckoutFormSkeleton />
          </div>

          {/* Right Column - Order Summary Skeleton */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <OrderSummarySkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Handle pending order scenario (Lifecycle Phase 4, Scenario C)
  if (pendingOrderData) {
    return (
      <div className="max-w-4xl mx-auto py-10 md:py-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Complete Your Payment</h1>
          <p className="text-lg text-muted-foreground">
            You are in the middle of paying for Order #
            {pendingOrderData.orderNumber}
          </p>
        </div>

        <div className="bg-white border border-dashed rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

          <div className="space-y-3 mb-6">
            {pendingOrder.orderItems?.map((item: any) => (
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
              <span>UGX {pendingOrder.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>UGX {pendingOrder.shippingCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>UGX {pendingOrder.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetryPayment}
            disabled={processPaymentMutation.isPending || isProcessingOrder}
            className="px-8 py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processPaymentMutation.isPending || isProcessingOrder
              ? "Processing..."
              : "Retry Payment"}
          </button>

          <button
            onClick={handleCancelOrder}
            disabled={cancelPendingOrderMutation.isPending}
            className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelPendingOrderMutation.isPending
              ? "Cancelling..."
              : "Cancel Order"}
          </button>
        </div>
      </div>
    );
  }

  // Show empty cart message if no cart or cart is empty
  if (!userCart || !userCart.cartItems || userCart.cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-10 md:py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Add some items to your cart to proceed with checkout
        </p>
        <button
          onClick={() => router.push('/marketplace')}
          className="px-8 py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625]"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 md:py-20 relative">
      {/* Processing Overlay */}
      {(createOrderMutation.isPending || isProcessingOrder) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5F82A] mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">
              {createOrderMutation.isPending
                ? "Creating Your Order..."
                : "Processing Payment..."}
            </h3>
            <p className="text-gray-600">
              {createOrderMutation.isPending
                ? "Please wait while we prepare your order"
                : "Redirecting to payment gateway..."}
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Checkout Form */}
        <div className="border border-dashed rounded-lg px-5 py-1 m-4 md:m-0 bg-white">
          <CheckoutForm
            onFormValidChange={handleFormValidChange}
            onFormDataChange={handleFormDataChange}
            onShippingAddressChange={handleShippingAddressChange}
          />
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <OrderSummary
            userCart={userCart}
            shippingCost={formState.shippingCost}
            onPrimaryAction={handlePlaceOrder}
            primaryActionText={
              createOrderMutation.isPending
                ? "Creating Order..."
                : isProcessingOrder
                  ? "Processing Payment..."
                  : "Place Order"
            }
            primaryActionDisabled={
              !formState.isValid ||
              createOrderMutation.isPending ||
              isProcessingOrder
            }
            onCouponChange={handleCouponChange}
          />
        </div>
      </div>
    </div>
  );
}
