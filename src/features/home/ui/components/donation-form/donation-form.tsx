"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { monthlyAmounts, oneTimeAmounts } from "@/features/donate/lib/utils";
import { trpc } from "@/trpc/client";

import DonationFormContent from "./donation-form-content";
import { useFormValidation } from "@/features/home/lib/hooks/use-form-validation";
import AmountSelector from "../amount-selector";
import { useRouter } from "next/navigation";
import { generateDonationId } from "@/modules/donate/server/procedure";
import { PesapalOrderRequest } from "@/modules/payments/schema";
import { formatDateToDDMMYYYY } from "@/modules/payments/utils";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function DonationForm() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [donationType, setDonationType] = useState<"monthly" | "one-time">(
    "monthly"
  );
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "card">("card");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amountError, setAmountError] = useState<string>("");

  const { form, validateAmount } = useFormValidation();

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Use the donations router procedures
  const createDonation = trpc.donations.create.useMutation();
  const registerIpn = trpc.payments.registerIpn.useMutation();
  const processPayment = trpc.payments.submitOrder.useMutation();

  const onSubmit = async (data: FormData) => {
    // Validate amount
    const amountValidationError = validateAmount(selectedAmount, customAmount);
    if (amountValidationError) {
      setAmountError(amountValidationError);
      return;
    }

    const donationAmount = selectedAmount || Number(customAmount);

    try {
      // Create donation record
      const donation = await createDonation.mutateAsync({
        amount: donationAmount,
        type: donationType === "monthly" ? "monthly" : "one_time",
        isBankTransfer: paymentMethod === "bank" ? "true" : "false",
        donorInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        },
        ...(donationType === "monthly" && {
          recurringDetails: {
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(), // Default to 1 year
          },
        }),
      });

      // Process payment if using card method
      if (paymentMethod === "card") {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL_PROD;

        const ipnResult = await registerIpn.mutateAsync({
          ipn_notification_type: "POST",
          url: `${baseUrl}/api/webhooks/pesapal`,
        });

        const orderPayload: PesapalOrderRequest = {
          id: donation.donationId,
          amount: donationAmount,
          currency: "USD",
          description: `Donation to KAPCDAM - ${donationType === "monthly" ? "Monthly" : "One-time"}`,
          callback_url: `${baseUrl}/api/payment/callback`,
          notification_id: ipnResult.ipn_id,
          billing_address: {
            email_address: donation.donorInfo.email,
            phone_number: donation.donorInfo.phone,
            country_code: "UG",
            first_name: donation.donorInfo.firstName,
            last_name: donation.donorInfo.lastName,
          },
        };

        if (donationType === "monthly") {
          orderPayload.subscription_details = {
            start_date: formatDateToDDMMYYYY(new Date()),
            end_date: formatDateToDDMMYYYY(
              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            ),
            frequency: "MONTHLY",
          };
          orderPayload.account_number = donation.donationId;
        }

        console.log("Order Payload", orderPayload);

        const paymentResult = await processPayment.mutateAsync(orderPayload);

        // Redirect to Pesapal payment page
        if (paymentResult.redirect_url) {
          router.push(paymentResult.redirect_url);
        } else {
          throw new Error("Payment redirect URL not received");
        }
      } else {
        // Bank transfer method
        alert(
          `Thank you for your donation! Your reference number is: ${referenceNumber}. Please use this reference when making your bank transfer.`
        );
        setIsOpen(false);
        form.reset();
        setSelectedAmount(null);
        setCustomAmount("");
        setIsCustomSelected(false);
      }
    } catch (error) {
      console.error("Donation submission error:", error);
      alert("There was an error processing your donation. Please try again.");
    }
  };

  const hasAmount = selectedAmount || customAmount;
  const hasValidAmount =
    hasAmount && (!customAmount || Number(customAmount) > 0);
  const isProcessing = createDonation.isPending || processPayment.isPending;

  const DonateButton = ({ children }: { children: React.ReactNode }) => (
    <Button
      className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      disabled={!hasValidAmount || isProcessing}
      onClick={() => setIsOpen(true)}
    >
      {isProcessing ? "Processing..." : children}
    </Button>
  );

  const renderTabContent = (
    tabValue: "monthly" | "once",
    amounts: number[],
    buttonText: string
  ) => (
    <TabsContent value={tabValue}>
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Choose an amount to give{tabValue === "monthly" ? " per month" : ""}
        </h3>
        <AmountSelector
          amounts={amounts}
          selectedAmount={selectedAmount}
          onAmountSelect={handleAmountSelect}
          customAmount={customAmount}
          onCustomAmountChange={handleCustomAmountChange}
          isCustomSelected={isCustomSelected}
          onCustomSelect={handleCustomSelect}
          donationType={donationType}
        />
        {isMobile ? (
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
              <DonateButton>{buttonText}</DonateButton>
            </DrawerTrigger>
            <DrawerContent className="max-h-[90vh]">
              <DrawerHeader>
                <DrawerTitle>Complete Your Donation</DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <DonationFormContent
                  form={form}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                  referenceNumber={referenceNumber}
                  selectedAmount={selectedAmount}
                  customAmount={customAmount}
                  donationType={donationType}
                  isSubmitting={form.formState.isSubmitting || isProcessing}
                  onSubmit={onSubmit}
                  amountError={amountError}
                />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <DonateButton>{buttonText}</DonateButton>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md h-full">
              <SheetHeader className="flex-shrink-0 border-b border-gray-200 pb-5">
                <SheetTitle>Complete Your Donation</SheetTitle>
                <SheetDescription>
                  Please fill in the form below to complete your donation.
                </SheetDescription>
              </SheetHeader>
              <div className="h-full overflow-y-auto py-4">
                <DonationFormContent
                  form={form}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                  referenceNumber={referenceNumber}
                  selectedAmount={selectedAmount}
                  customAmount={customAmount}
                  donationType={donationType}
                  isSubmitting={form.formState.isSubmitting || isProcessing}
                  onSubmit={onSubmit}
                  amountError={amountError}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </TabsContent>
  );

  return (
    <Card className="w-full max-w-md bg-white shadow-xl">
      <CardContent className="p-6">
        <Tabs
          defaultValue={donationType}
          onValueChange={(value) =>
            setDonationType(value as "monthly" | "one-time")
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger
              value="once"
              className="text-sm font-medium data-[state=active]:bg-yellow-400"
            >
              One-Time Gift
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="text-sm font-medium data-[state=active]:bg-yellow-400"
            >
              Monthly Giving
            </TabsTrigger>
          </TabsList>

          {renderTabContent("monthly", monthlyAmounts, "Donate Monthly")}
          {renderTabContent("once", oneTimeAmounts, "Donate Now")}
        </Tabs>

        <div className="text-center space-y-2 border-t border-dashed border-gray-200 pt-4 mt-5">
          <p className="text-xs text-gray-500">
            🔒 Your donation is secure and will be used to support our mission.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
