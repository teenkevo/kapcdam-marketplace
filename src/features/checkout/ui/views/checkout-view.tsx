"use client";

import { useState } from "react";

import { OrderSummary } from "../components/order-summary";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CheckoutForm from "../components/CheckoutForm";
import { useCheckoutForm } from "../../hooks/use-checkout-form";
import {
  CheckoutFormSkeleton,
  OrderSummarySkeleton,
} from "../components/checkout-skeleton";

interface CheckoutViewProps {
  cartId: string;
}

export default function CheckoutView({ cartId }: CheckoutViewProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: userCart, isLoading: isCartLoading } = useQuery(
    trpc.cart.getCartById.queryOptions({ cartId })
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
      cartId,
      shippingAddress: formData.selectedAddress,
      deliveryMethod: formData.deliveryMethod,
      paymentMethod: formData.paymentMethod,
      selectedDeliveryZone: formData.selectedDeliveryZone,
      appliedCoupon,
    };

    console.log("Submitting order with data:", orderData); // Debug log
    createOrderMutation.mutate(orderData);
  };

  if (isCartLoading || !userCart) {
    return (
      <div className="max-w-7xl mx-auto py-20">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center">Secure Checkout</h1>
        </div>

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

  return (
    <div className="max-w-7xl mx-auto py-20 relative">
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

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center">Secure Checkout</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Checkout Form */}
        <div>
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
