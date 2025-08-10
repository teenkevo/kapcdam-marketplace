"use client";

import { useQueryStates, parseAsString } from "nuqs";
import { useEffect } from "react";

interface CheckoutStateManagerProps {
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  view: 'payment-redirect' | 'pending-failed' | 'success';
  mode?: 'pending' | 'failed';
}

export function CheckoutStateManager({ 
  paymentStatus, 
  orderStatus, 
  paymentMethod, 
  view, 
  mode 
}: CheckoutStateManagerProps) {
  const [searchParams, setSearchParams] = useQueryStates({
    'payment-status': parseAsString.withDefault(''),
    'order-status': parseAsString.withDefault(''),
    'payment-method': parseAsString.withDefault(''),
    'view': parseAsString.withDefault(''),
    'mode': parseAsString.withDefault(''),
  });

  // Sync URL params with actual state (one-way: state -> URL)
  useEffect(() => {
    setSearchParams({
      'payment-status': paymentStatus,
      'order-status': orderStatus, 
      'payment-method': paymentMethod,
      'view': view,
      'mode': mode || '',
    });
  }, [paymentStatus, orderStatus, paymentMethod, view, mode, setSearchParams]);

  // This component only manages URL state, renders nothing
  return null;
}