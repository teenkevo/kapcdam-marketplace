"use client";

import type React from "react";
import { useState, useEffect, useCallback, useTransition } from "react";
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

import DonationFormContent from "./donation-form-content";
import { useFormValidation } from "@/features/home/lib/hooks/use-form-validation";
import AmountSelector from "../amount-selector";
import { useRouter } from "next/navigation";
import { makeDonation } from "@/modules/donate/actions";
import { toast } from "sonner";
import RedirectToPayDialog from "@/components/redirect-to-pay-dialog";
import { BankDonationRecordDialog } from "@/components/bank-donation-record.dialog";

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
    "one-time"
  );
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "card">("card");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amountError, setAmountError] = useState<string>("");
  const [redirectDialogOpen, setRedirectDialogOpen] = useState(false);
  const [bankDonationRecordDialogOpen, setBankDonationRecordDialogOpen] =
    useState(false);
  const { form, validateAmount } = useFormValidation();
  const [isPending, setIsPending] = useState<boolean>(false);

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

  const onSubmit = async (data: FormData) => {
    const amountValidationError = validateAmount(selectedAmount, customAmount);
    if (amountValidationError) {
      setAmountError(amountValidationError);
      return;
    }

    const donationAmount = selectedAmount || Number(customAmount);

    setIsPending(true);

    try {
      const result = await makeDonation({
        donationAmount,
        donationType,
        paymentMethod,
        data,
      });

      if (result.readyToRedirect && result.redirectUrl) {
        setRedirectDialogOpen(true);
        setIsOpen(false);
        setTimeout(() => {
          router.push(result.redirectUrl);
        }, 3000);
      }

      // Create donation record
      if (paymentMethod === "bank" && result.success) {
        setIsOpen(false);
        form.reset();
        setPaymentMethod("card");
        setSelectedAmount(null);
        setCustomAmount("");
        setIsCustomSelected(false);
        setBankDonationRecordDialogOpen(true);
      }
    } catch (error) {
      console.error("Donation submission error:", error);
      toast.error(
        "There was an error processing your donation. Please try again."
      );
    } finally {
      setIsPending(false);
    }
  };

  const hasAmount = selectedAmount || customAmount;
  const hasValidAmount =
    hasAmount && (!customAmount || Number(customAmount) > 0);

  const DonateButton = ({ children }: { children: React.ReactNode }) => (
    <Button
      className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      disabled={!hasValidAmount || isPending}
      onClick={() => {
        setReferenceNumber(generateReferenceNumber());
        setIsOpen(true);
      }}
    >
      {isPending ? "Processing..." : children}
    </Button>
  );

  const renderTabContent = (
    tabValue: "monthly" | "one-time",
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
            <DrawerContent
              className="max-h-[100vh]"
              hideClose={isPending}
              onInteractOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
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
                  isSubmitting={form.formState.isSubmitting || isPending}
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
            <SheetContent
              side="right"
              className="w-full sm:max-w-md h-full"
              hideClose={form.formState.isSubmitting || isPending}
              onInteractOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
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
                  isSubmitting={form.formState.isSubmitting || isPending}
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
              value="one-time"
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
          {renderTabContent("one-time", oneTimeAmounts, "Donate Now")}
        </Tabs>

        <div className="text-center space-y-2 border-t border-dashed border-gray-200 pt-4 mt-5">
          <p className="text-xs text-gray-500">
            🔒 Your donation is secure and will be used to support our mission.
          </p>
        </div>
        <RedirectToPayDialog
          open={redirectDialogOpen}
          onOpenChange={setRedirectDialogOpen}
        />
        <BankDonationRecordDialog
          open={bankDonationRecordDialogOpen}
          setOpen={setBankDonationRecordDialogOpen}
          donation={{
            donationId: referenceNumber,
            amount: selectedAmount || Number(customAmount),
          }}
        />
      </CardContent>
    </Card>
  );
}
