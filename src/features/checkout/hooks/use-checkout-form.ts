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
    setFormState((prev) => {
      // Calculate shipping cost based on delivery method and selected zone
      const calculateShippingCost = (): number => {
        if (data.deliveryMethod === "pickup") {
          return 0;
        }

        // Use delivery zone fee if available, otherwise fallback to default
        if (data.selectedDeliveryZone) {
          return data.selectedDeliveryZone.fee;
        }

       
        return 50000; 
      };

      const shippingCost = calculateShippingCost();

      return {
        ...prev,
        formData: data,
        selectedAddress: data.selectedAddress,
        shippingCost,
      };
    });
  }, []);

  const handleShippingAddressChange = useCallback((address: AddressInput) => {
    setFormState((prev) => ({
      ...prev,
      selectedAddress: address,
     
    }));
  }, []);

  return {
    formState,
    handleFormValidChange,
    handleFormDataChange,
    handleShippingAddressChange,
  };
}
