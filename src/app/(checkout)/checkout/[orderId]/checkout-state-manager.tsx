"use client";

import { useQueryStates, parseAsString } from "nuqs";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

interface CheckoutStateManagerProps {
  orderId: string;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  view: 'payment-redirect' | 'pending-failed' | 'success';
  mode?: 'pending' | 'failed';
}

export function CheckoutStateManager({ 
  orderId,
  paymentStatus, 
  orderStatus, 
  paymentMethod, 
  view, 
  mode 
}: CheckoutStateManagerProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const hasProcessedInitialRedirect = useRef(false);

  const [searchParams, setSearchParams] = useQueryStates({
    'payment-status': parseAsString.withDefault(''),
    'order-status': parseAsString.withDefault(''),
    'payment-method': parseAsString.withDefault(''),
    'view': parseAsString.withDefault(''),
    'mode': parseAsString.withDefault(''),
  });

  const processPaymentMutation = useMutation(
    trpc.orders.processOrderPayment.mutationOptions({
      onSuccess: ({ paymentUrl }) => {
        // Redirect to payment gateway
        window.location.href = paymentUrl;
      },
      onError: (error) => {
        console.error("Payment processing failed:", error);
        // Refresh page to show error state
        router.refresh();
      },
    })
  );

  // Handle automatic redirect for not_initiated payments
  useEffect(() => {
    if (
      !hasProcessedInitialRedirect.current &&
      paymentMethod === "pesapal" &&
      paymentStatus === "not_initiated" &&
      orderStatus === "pending" &&
      !processPaymentMutation.isPending
    ) {
      hasProcessedInitialRedirect.current = true;
      processPaymentMutation.mutate({ orderId });
    }
  }, [paymentStatus, orderStatus, paymentMethod, orderId, processPaymentMutation]);

  // Sync URL params with actual state (bidirectional)
  useEffect(() => {
    // Only update URL if the current params are different from server state
    const currentParams = {
      'payment-status': paymentStatus,
      'order-status': orderStatus, 
      'payment-method': paymentMethod,
      'view': view,
      'mode': mode || '',
    };

    // Check if we need to update URL
    const needsUpdate = Object.entries(currentParams).some(([key, value]) => 
      searchParams[key as keyof typeof searchParams] !== value
    );

    if (needsUpdate) {
      setSearchParams(currentParams, { 
        shallow: true, // Don't cause a full page reload
        scroll: false  // Don't scroll to top
      });
    }
  }, [paymentStatus, orderStatus, paymentMethod, view, mode, setSearchParams, searchParams]);

  // Handle browser navigation events (back/forward) 
  useEffect(() => {
    const handleUrlChange = () => {
      // If URL params suggest a different state than what's shown,
      // refresh to get the correct view
      const urlPaymentStatus = searchParams['payment-status'];
      const urlView = searchParams['view'];
      
      if (
        (urlPaymentStatus && urlPaymentStatus !== paymentStatus) ||
        (urlView && urlView !== view)
      ) {
        router.refresh();
      }
    };

    // Listen for URL changes via nuqs
    handleUrlChange();
  }, [searchParams, paymentStatus, view, router]);

  // This component only manages URL state and redirects, renders nothing
  return null;
}