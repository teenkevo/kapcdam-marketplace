"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Form } from "@/components/ui/form";
import PersonalInfoForm from "./personal-info-form";
import PaymentMethodSelector from "./payment-method-selector";
import type { UseFormReturn } from "react-hook-form";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface DonationFormContentProps {
  form: UseFormReturn<FormData>;
  paymentMethod: "bank" | "card";
  onPaymentMethodChange: (method: "bank" | "card") => void;
  referenceNumber: string;
  selectedAmount: number | null;
  customAmount: string;
  donationType: "monthly" | "one-time";
  isSubmitting: boolean;
  onSubmit: (data: FormData) => void;
  amountError?: string;
}

export default function DonationFormContent({
  form,
  paymentMethod,
  onPaymentMethodChange,
  referenceNumber,
  selectedAmount,
  customAmount,
  donationType,
  isSubmitting,
  onSubmit,
  amountError,
}: DonationFormContentProps) {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 md:px-[1px] md:pb-14 px-2"
      >
        <PersonalInfoForm control={form.control} isPending={isSubmitting} />

        {amountError && (
          <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{amountError}</span>
          </div>
        )}

        <PaymentMethodSelector
          paymentMethod={paymentMethod}
          onPaymentMethodChange={onPaymentMethodChange}
          referenceNumber={referenceNumber}
        />

        <Button
          type="submit"
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <>
              {paymentMethod === "bank"
                ? "Record My Donation"
                : donationType === "monthly"
                  ? "Start Monthly Giving -"
                  : "Donate Now -"}
              {(selectedAmount || customAmount) && (
                <span>
                  ${selectedAmount || customAmount}
                  {donationType === "monthly" ? "/month" : ""}
                </span>
              )}
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 space-y-2">
          {paymentMethod === "bank" ? (
            <p className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <strong>Next Steps:</strong> Please proceed with your bank
              transfer using the details above. Your donation will be confirmed
              once we receive the payment. Please include the "{referenceNumber}
              " in your transfer note to ensure your donation is properly
              recorded.
            </p>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
