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
import { Loader2 } from "lucide-react";

export default function CheckoutView() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

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

  const createOrderMutation = useMutation(
    trpc.orders.createOrder.mutationOptions({
      onSuccess: async (result) => {
        toast.success(`Order ${result.orderNumber} created successfully!`);

        try {
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
        }

        router.push(`/checkout/${result.orderId}`);
      },
      onError: (error) => {
        toast.error(`Failed to create order: ${error.message}`);
        console.error("Order creation error:", error);
      },
    })
  );

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

    setIsProcessingOrder(true);

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

  if (isCartLoading) {
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

  if (isProcessingOrder && userCart?.cartItems?.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-10 md:py-20 relative">
        <div className=" inset-0 bg-white/50 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-sm shadow-lg text-center">
            <Loader2 className="animate-spin rounded-full h-12 w-12 text-[#C5F82A] mx-auto mb-4" />
            <h3 className="text-base font-medium mb-2">
              {createOrderMutation.isPending
                ? "Creating Your Order..."
                : "Redirecting you to secure payment..."}
            </h3>
            {createOrderMutation.isPending && (
              <p className="text-gray-600 text-sm">
                Please wait while we prepare your order
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 md:py-20 relative">
      {/* Processing Overlay - simplified for order creation only */}

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
                : "Place Order"
            }
            primaryActionDisabled={
              !formState.isValid || createOrderMutation.isPending
            }
            onCouponChange={handleCouponChange}
          />
        </div>
      </div>
    </div>
  );
}
