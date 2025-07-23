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
      firstName: "Shafic",
      lastName: "Zziwa",
      email: "shafic@gmail.com",
      phone: "+256761074816",
    },
  });

  // form.setValue("firstName", "Shafic");
  // form.setValue("lastName", "Zziwa");
  // form.setValue("email", "shafic@gmail.com");
  // form.setValue("phone", "+256761074816");

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
