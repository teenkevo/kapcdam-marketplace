"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote } from "lucide-react";
import { FormSection } from "@/components/shared/form-section";
import { isSunday } from "date-fns";

interface PaymentMethodSelectorProps {
  paymentMethod: "bank" | "card";
  onPaymentMethodChange: (method: "bank" | "card") => void;
  referenceNumber: string;
  isSubmitting: boolean;
}

export default function PaymentMethodSelector({
  paymentMethod,
  onPaymentMethodChange,
  referenceNumber,
  isSubmitting,
}: PaymentMethodSelectorProps) {
  return (
    <FormSection
      title="Payment Method"
      description="Choose how you'd like to make your donation"
    >
      <RadioGroup
        disabled={isSubmitting}
        value={paymentMethod}
        onValueChange={(value) =>
          onPaymentMethodChange(value as "bank" | "card")
        }
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <div className="relative">
          <RadioGroupItem value="card" id="card" className="peer sr-only" />
          <Label
            htmlFor="card"
            className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-gray-50 ${
              paymentMethod === "card"
                ? "border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400 ring-opacity-20"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <CreditCard className="h-5 w-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">Online Payment</div>
              <div className="text-xs text-gray-500">Card / mobile money</div>
            </div>
          </Label>
        </div>

        <div className="relative">
          <RadioGroupItem value="bank" id="bank" className="peer sr-only" />
          <Label
            htmlFor="bank"
            className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-gray-50 ${
              paymentMethod === "bank"
                ? "border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400 ring-opacity-20"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Banknote className="h-5 w-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">Bank Transfer</div>
              <div className="text-xs text-gray-500">Direct bank transfer</div>
            </div>
          </Label>
        </div>
      </RadioGroup>

      {paymentMethod === "bank" && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm text-gray-900 font-bold mb-3">
            Bank Transfer Details
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Bank Name:</span>
              <span className="font-medium">Equity Bank Uganda</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Account Number:</span>
              <span className="font-medium">100320072660</span>
            </div>
            <div className="flex border-t border-gray-300 pt-2 mt-3 flex-col text-xs">
              <span className="text-gray-600">Account Name:</span>
              <span className="font-medium">
                Kampala Parents of Children with Disabilities Association
                Makindye
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-2 mt-3 text-xs">
              <span className="text-gray-600">Payment Reference:</span>
              <span className="font-medium text-green-600 bg-green-100 px-2 py-1 rounded text-xs">
                {referenceNumber}
              </span>
            </div>
          </div>
        </div>
      )}
    </FormSection>
  );
}
