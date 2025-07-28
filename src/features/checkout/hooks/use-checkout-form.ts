"use client";

import { useState, useCallback } from "react";
import {
  type CheckoutFormData,
  type AddressInput,
} from "../schemas/checkout-form";

export interface CheckoutFormState {
  isValid: boolean;
  formData: CheckoutFormData | null;
  selectedAddress: AddressInput | null;
  shippingCost: number;
}

export function useCheckoutForm() {
  const [formState, setFormState] = useState<CheckoutFormState>({
    isValid: false,
    formData: null,
    selectedAddress: null,
    shippingCost: 0,
  });

  const handleFormValidChange = useCallback((isValid: boolean) => {
    setFormState((prev) => ({ ...prev, isValid }));
  }, []);

  const handleFormDataChange = useCallback((data: CheckoutFormData) => {
    setFormState((prev) => ({
      ...prev,
      formData: data,
      selectedAddress: data.selectedAddress,
    }));
  }, []);

  const handleShippingAddressChange = useCallback((address: AddressInput) => {
    setFormState((prev) => {
      // Calculate shipping cost based on delivery method and address
      const calculateShippingCost = (addr: AddressInput, deliveryMethod?: string): number => {
        // Basic shipping calculation - can be enhanced
        if (deliveryMethod === "pickup") {
          return 0;
        }

        // Default local delivery cost
        return 50000; // UGX 50,000 for local delivery
      };

      const shippingCost = calculateShippingCost(address, prev.formData?.deliveryMethod);

      return {
        ...prev,
        selectedAddress: address,
        shippingCost,
      };
    });
  }, []);

  return {
    formState,
    handleFormValidChange,
    handleFormDataChange,
    handleShippingAddressChange,
  };
}
