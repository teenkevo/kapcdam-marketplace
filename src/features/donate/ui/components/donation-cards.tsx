"use client";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Heart,
  Shield,
  Users,
  BookOpen,
  Stethoscope,
  CheckCircle,
} from "lucide-react";
import AmountSelector from "@/features/home/ui/components/amount-selector";
import DonationFormContent from "@/features/home/ui/components/donation-form/donation-form-content";
import { useFormValidation } from "@/features/home/lib/hooks/use-form-validation";
import { monthlyAmounts, oneTimeAmounts } from "@/features/donate/lib/utils";
import { makeDonation } from "@/features/donate/server/actions";
import { toast } from "sonner";
import { BankDonationRecordDialog } from "@/components/bank-donation-record.dialog";
import RedirectToPayDialog from "@/components/redirect-to-pay-dialog";
import { useRouter } from "next/navigation";

interface DonationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function DonationCards() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [donationType, setDonationType] = useState<"monthly" | "one-time">(
    "one-time"
  );

  const [paymentMethod, setPaymentMethod] = useState<"bank" | "card">("card");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amountError, setAmountError] = useState<string>("");
  const [redirectDialogOpen, setRedirectDialogOpen] = useState(false);
  const [bankDonationRecordDialogOpen, setBankDonationRecordDialogOpen] =
    useState(false);

  const { form, validateAmount } = useFormValidation();

  const generateReferenceNumber = useCallback(() => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `DON-${timestamp}-${random}`;
  }, []);

  useEffect(() => {
    if (paymentMethod === "bank" && !referenceNumber) {
      setReferenceNumber(generateReferenceNumber());
    }
  }, [paymentMethod, referenceNumber, generateReferenceNumber]);

  const handlePaymentMethodChange = useCallback(
    (method: "bank" | "card") => {
      setPaymentMethod(method);
      if (method === "bank") {
        setReferenceNumber(generateReferenceNumber());
      }
    },
    [generateReferenceNumber]
  );

  const handleAmountSelect = useCallback((amount: number) => {
    setSelectedAmount(amount);
    setIsCustomSelected(false);
    setCustomAmount("");
    setAmountError("");
  }, []);

  const handleCustomSelect = useCallback(() => {
    setIsCustomSelected(true);
    setSelectedAmount(null);
  }, []);

  const handleCustomAmountChange = useCallback(
    (amount: string) => {
      setCustomAmount(amount);
      if (amount && !isCustomSelected) {
        handleCustomSelect();
      }
      if (amount) {
        setAmountError("");
      }
    },
    [isCustomSelected, handleCustomSelect]
  );

  const onSubmit = async (data: DonationFormData) => {
    // Validate amount
    const amountValidationError = validateAmount(selectedAmount, customAmount);
    if (amountValidationError) {
      setAmountError(amountValidationError);
      return;
    }

    try {
      const result = await makeDonation({
        donationAmount: selectedAmount || Number(customAmount),
        donationType,
        paymentMethod,
        data,
      });

      if (result.readyToRedirect && result.redirectUrl) {
        setRedirectDialogOpen(true);

        setTimeout(() => {
          router.push(result.redirectUrl);
        }, 3000);
      }

      if (paymentMethod === "bank" && result.success) {
        setBankDonationRecordDialogOpen(true);
        form.reset();
        setBankDonationRecordDialogOpen(true);
      }

      form.reset();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        "There was an error processing your donation. Please try again."
      );
    }
  };

  const impactData = [
    {
      amount: 10,
      impact: "Provides school supplies for 1 child for a month",
      icon: BookOpen,
    },
    {
      amount: 25,
      impact: "Covers basic healthcare needs for 1 child for a month",
      icon: Stethoscope,
    },
    {
      amount: 50,
      impact: "Supports vocational training for 1 person for a month",
      icon: Users,
    },
    {
      amount: 100,
      impact: "Provides comprehensive support for 1 child for a month",
      icon: Heart,
    },
  ];

  return (
    <section className="relative -mt-[20vh] z-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Card - Make Your Donation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  Make Your Donation
                </CardTitle>
                <p className="text-gray-600 ">
                  Choose how you want to contribute to the cause.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Donation Type Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      donationType === "one-time"
                        ? "bg-black text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setDonationType("one-time")}
                  >
                    One-Time Gift
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      donationType === "monthly"
                        ? "bg-black text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setDonationType("monthly")}
                  >
                    Monthly Giving
                  </button>
                </div>

                {/* Amount Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Amount (USD)
                  </label>
                  <AmountSelector
                    amounts={
                      donationType === "monthly"
                        ? monthlyAmounts
                        : oneTimeAmounts
                    }
                    selectedAmount={selectedAmount}
                    onAmountSelect={handleAmountSelect}
                    customAmount={customAmount}
                    onCustomAmountChange={handleCustomAmountChange}
                    isCustomSelected={isCustomSelected}
                    onCustomSelect={handleCustomSelect}
                    donationType={donationType}
                  />
                </div>

                {/* Personal Information */}
                {(selectedAmount || customAmount) && (
                  <div className="space-y-4">
                    <DonationFormContent
                      form={form}
                      paymentMethod={paymentMethod}
                      onPaymentMethodChange={handlePaymentMethodChange}
                      referenceNumber={referenceNumber}
                      selectedAmount={selectedAmount}
                      customAmount={customAmount}
                      donationType={donationType}
                      isSubmitting={form.formState.isSubmitting}
                      onSubmit={onSubmit}
                      amountError={amountError}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Card - Your Impact */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Your Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {impactData.map((item) => (
                    <div
                      key={item.amount}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        selectedAmount === item.amount
                          ? "border-yellow-400 bg-yellow-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            ${item.amount}
                            {donationType === "monthly" ? "/month" : ""}
                          </p>
                          <p className="text-sm text-gray-600">{item.impact}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Why Give Monthly */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3">Why Give Monthly?</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Provides consistent support for ongoing programs
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Helps us plan and budget for long-term impact
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Lower processing fees mean more goes to children
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Transparency */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    100%
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    of your donation goes directly to supporting disabled
                    children
                  </div>
                  <Button variant="outline" size="sm">
                    View Financial Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      <BankDonationRecordDialog
        open={bankDonationRecordDialogOpen}
        setOpen={setBankDonationRecordDialogOpen}
        donation={{
          donationId: referenceNumber,
          amount: selectedAmount || Number(customAmount),
        }}
      />
      <RedirectToPayDialog
        open={redirectDialogOpen}
        onOpenChange={setRedirectDialogOpen}
      />
    </section>
  );
}
