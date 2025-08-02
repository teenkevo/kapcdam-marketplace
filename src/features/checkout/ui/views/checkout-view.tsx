"use client";

import { useState, useEffect } from "react";

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
import { useCartSync } from "@/features/cart/hooks/use-cart-sync";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

interface CheckoutViewProps {
  cartId: string;
}

export default function CheckoutView({ cartId }: CheckoutViewProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const { isSyncing } = useCartSync();
  
  // Handle special "sync" cart ID
  const isSyncingCart = cartId === "sync";
  
  const { data: userCart, isLoading: isCartLoading } = useQuery({
    ...trpc.cart.getCartById.queryOptions({ cartId }),
    enabled: !isSyncingCart, // Don't fetch if syncing
  });

  // For syncing cart, get the actual user cart
  const { data: actualUserCart, isLoading: isActualCartLoading } = useQuery({
    ...trpc.cart.getUserCart.queryOptions(),
    enabled: isSyncingCart && isSignedIn,
    refetchInterval: isSyncingCart && isSyncing ? 500 : false,
  });

  // Handle cart sync redirect
  useEffect(() => {
    if (isSyncingCart && actualUserCart?._id && !isSyncing) {
      // Replace URL without page reload for seamless transition
      window.history.replaceState(null, '', `/checkout/c/${actualUserCart._id}`);
      // Force component re-render with new cart data
      window.location.reload();
    }
  }, [isSyncingCart, actualUserCart?._id, isSyncing]);

  // Use the appropriate cart data
  const currentCart = isSyncingCart ? actualUserCart : userCart;
  const currentIsLoading = isSyncingCart ? isActualCartLoading : isCartLoading;

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
          await queryClient.invalidateQueries({ queryKey: ['cart'] });
          
          // 2. Remove all cart query cache to force fresh fetch
          queryClient.removeQueries({ queryKey: ['cart'] });
          
          // 3. Specifically invalidate getUserCart query
          await queryClient.invalidateQueries(trpc.cart.getUserCart.queryOptions());
          
          // 4. Invalidate cart display data queries
          await queryClient.invalidateQueries({ 
            queryKey: ['cart', 'getDisplayData']
          });
          
          // 5. Invalidate cart by ID query if it exists
          if (cartId) {
            await queryClient.invalidateQueries(
              trpc.cart.getCartById.queryOptions({ cartId })
            );
          }
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

  // Unified loading state management
  const getLoadingState = () => {
    // Priority 1: Cart sync in progress (highest priority)
    if (isSyncingCart && isSignedIn && isSyncing) {
      return { type: 'sync', message: 'Syncing your cart items...' };
    }
    
    // Priority 2: Loading cart data
    if (currentIsLoading) {
      return { type: 'skeleton', message: 'Loading checkout...' };
    }
    
    // Priority 3: Waiting for cart sync to complete but no cart yet
    if (isSyncingCart && isSignedIn && !isSyncing && !actualUserCart) {
      return { type: 'sync', message: 'Preparing your cart...' };
    }
    
    // Priority 4: No cart data available
    if (!currentCart) {
      return { type: 'skeleton', message: 'Loading checkout...' };
    }
    
    return null;
  };

  const loadingState = getLoadingState();
  const showCartSyncOverlay = loadingState?.type === 'sync';
  const showSkeletonLoading = loadingState?.type === 'skeleton';

  if (showSkeletonLoading) {
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
      {/* Cart Sync Overlay - Clear messaging based on loading state */}
      {showCartSyncOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-[#C5F82A]" />
            <h3 className="text-base font-medium mb-1">{loadingState?.message}</h3>
            <p className="text-sm text-gray-600">This will only take a moment</p>
          </div>
        </div>
      )}

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
            cartId={isSyncingCart ? "sync" : cartId}
          />
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <OrderSummary
            userCart={currentCart || null}
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
              isProcessingOrder ||
              showCartSyncOverlay
            }
            onCouponChange={handleCouponChange}
          />
        </div>
      </div>
    </div>
  );
}
