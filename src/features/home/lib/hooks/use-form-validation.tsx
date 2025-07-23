"use client";

import { useForm } from "react-hook-form";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export function useFormValidation() {
  const form = useForm<FormData>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  const validateAmount = (
    selectedAmount: number | null,
    customAmount: string
  ): string | null => {
    if (!selectedAmount && !customAmount) {
      return "Please select or enter a donation amount";
    }
    if (
      customAmount &&
      (isNaN(Number(customAmount)) || Number(customAmount) <= 0)
    ) {
      return "Please enter a valid amount greater than 0";
    }
    return null;
  };

  return {
    form,
    validateAmount,
  };
}
