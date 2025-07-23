"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
import AmountSelector from "./amount-selector";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote, AlertCircle } from "lucide-react";
import { trpc } from "@/trpc/client";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  amount?: string;
}

export default function DonationForm() {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data and validation
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustomSelected(false);
    setCustomAmount("");
    // Clear amount error when amount is selected
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const handleCustomSelect = () => {
    setIsCustomSelected(true);
    setSelectedAmount(null);
  };

  const handleCustomAmountChange = (amount: string) => {
    setCustomAmount(amount);
    if (amount && !isCustomSelected) {
      handleCustomSelect();
    }
    // Clear amount error when custom amount is entered
    if (errors.amount && amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `DON-${timestamp}-${random}`;
  };

  useEffect(() => {
    if (paymentMethod === "bank" && !referenceNumber) {
      setReferenceNumber(generateReferenceNumber());
    }
  }, [paymentMethod, referenceNumber]);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Validate amount
    if (!selectedAmount && !customAmount) {
      newErrors.amount = "Please select or enter a donation amount";
    } else if (
      customAmount &&
      (isNaN(Number(customAmount)) || Number(customAmount) <= 0)
    ) {
      newErrors.amount = "Please enter a valid amount greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleInputBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate individual field on blur
    const newErrors = { ...errors };

    switch (field) {
      case "firstName":
        if (!formData.firstName.trim()) {
          newErrors.firstName = "First name is required";
        }
        break;
      case "lastName":
        if (!formData.lastName.trim()) {
          newErrors.lastName = "Last name is required";
        }
        break;
      case "email":
        if (!formData.email.trim()) {
          newErrors.email = "Email address is required";
        } else if (!validateEmail(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }
        break;
      case "phone":
        if (!formData.phone.trim()) {
          newErrors.phone = "Phone number is required";
        } else if (!validatePhone(formData.phone)) {
          newErrors.phone = "Please enter a valid phone number";
        }
        break;
    }

    setErrors(newErrors);
  };

  // TRPC mutations
  const createDonation = trpc.donations.create.useMutation();
  const processPayment = trpc.donations.processPayment.useMutation();

  const handleSubmit = async () => {
    // Mark all fields as touched
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    });

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const finalAmount = Number(selectedAmount || customAmount);
      const donationType_mapped = donationType === "monthly" ? "monthly" : "one_time";

      // For bank transfers, just create the donation record
      if (paymentMethod === "bank") {
        const donation = await createDonation.mutateAsync({
          amount: finalAmount,
          type: donationType_mapped,
          donorInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
          },
          ...(donationType === "monthly" && {
            recurringDetails: {
              startDate: new Date().toISOString(),
            },
          }),
        });

        alert(
          `Thank you for your donation! Please proceed with your bank transfer using reference number: ${referenceNumber}. You will receive a confirmation email once we receive your payment.`
        );
        setIsOpen(false);
        return;
      }

      // For card/mobile payments, create donation and process payment
      const donation = await createDonation.mutateAsync({
        amount: finalAmount,
        type: donationType_mapped,
        donorInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
        ...(donationType === "monthly" && {
          recurringDetails: {
            startDate: new Date().toISOString(),
          },
        }),
      });

      // Process payment through Pesapal
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL_PROD || window.location.origin;
      const paymentResult = await processPayment.mutateAsync({
        donationId: donation.donationId,
        callback_url: `${baseUrl}/api/payment/callback`,
        notification_id: crypto.randomUUID(),
      });

      // Redirect to payment page
      if (paymentResult.redirect_url) {
        window.location.href = paymentResult.redirect_url;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error) {
      console.error("Donation submission error:", error);
      alert("There was an error processing your donation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAmount = selectedAmount || customAmount;
  const hasValidAmount =
    hasAmount && (!customAmount || Number(customAmount) > 0);

  const DonationContent = () => (
    <div className="space-y-6 md:px-[1px] px-2">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Your Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Input
              required
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              onBlur={() => handleInputBlur("firstName")}
              className={
                errors.firstName && touched.firstName ? "border-red-500" : ""
              }
            />
            {errors.firstName && touched.firstName && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                {errors.firstName}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Input
              required
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              onBlur={() => handleInputBlur("lastName")}
              className={
                errors.lastName && touched.lastName ? "border-red-500" : ""
              }
            />
            {errors.lastName && touched.lastName && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                {errors.lastName}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <Input
            placeholder="Email Address"
            type="email"
            required
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            onBlur={() => handleInputBlur("email")}
            className={errors.email && touched.email ? "border-red-500" : ""}
          />
          {errors.email && touched.email && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              {errors.email}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <Input
            placeholder="Phone Number"
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            onBlur={() => handleInputBlur("phone")}
            className={errors.phone && touched.phone ? "border-red-500" : ""}
          />
          {errors.phone && touched.phone && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              {errors.phone}
            </div>
          )}
        </div>
      </div>

      {/* Amount Error Display */}
      {errors.amount && (
        <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="h-3 w-3" />
          {errors.amount}
        </div>
      )}

      {/* Payment Method */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Payment Method</h3>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as "bank" | "card")}
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <RadioGroupItem value="card" id="card" className="peer sr-only" />
              <Label
                htmlFor="card"
                className={`flex items-center space-x-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  paymentMethod === "card"
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span className="font-medium">Card / Mobile</span>
              </Label>
            </div>
            <div className="relative">
              <RadioGroupItem value="bank" id="bank" className="peer sr-only" />
              <Label
                htmlFor="bank"
                className={`flex items-center space-x-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  paymentMethod === "bank"
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Banknote className="h-4 w-4" />
                <span className="font-medium">Bank Transfer</span>
              </Label>
            </div>
          </div>
        </RadioGroup>

        {/* Bank Transfer Details */}
        {paymentMethod === "bank" && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Bank Name:</span>
                <span className="font-medium">Stanbic Bank Uganda</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Name:</span>
                <span className="font-medium">KAPCDAM Uganda</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Number:</span>
                <span className="font-medium">1234567890</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Reference</span>
                <span className="font-medium text-green-600">
                  {referenceNumber}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Donate Button */}
      <Button
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          "Processing..."
        ) : (
          <>
            {paymentMethod === "bank"
              ? "Record My Donation"
              : donationType === "monthly"
                ? "Start Monthly Giving"
                : "Donate Now"}
            {(selectedAmount || customAmount) && (
              <span className="ml-2">
                - ${selectedAmount || customAmount}
                {donationType === "monthly" ? "/month" : ""}
              </span>
            )}
          </>
        )}
      </Button>

      {paymentMethod === "bank" ? (
        <p className="text-xs text-gray-500">
          Please proceed with your bank transfer using the details above. Your
          donation will be confirmed once we receive the payment. Please include
          the "{referenceNumber}" in your transfer note to ensure your donation
          is properly recorded.
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          Your donation is secure and encrypted. You will receive a
          tax-deductible receipt via email.
        </p>
      )}
    </div>
  );

  const DonateButton = ({ children }: { children: React.ReactNode }) => (
    <Button
      className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!hasValidAmount}
      onClick={() => setIsOpen(true)}
    >
      {children}
    </Button>
  );

  if (isMobile) {
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
                GIVE ONCE
              </TabsTrigger>
              <TabsTrigger
                value="monthly"
                className="text-sm font-medium data-[state=active]:bg-yellow-400"
              >
                MONTHLY
              </TabsTrigger>
            </TabsList>

            <TabsContent value="monthly">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Choose an amount to give per month
                </h3>
                <AmountSelector
                  amounts={[10, 20, 40, 100]}
                  selectedAmount={selectedAmount}
                  onAmountSelect={handleAmountSelect}
                  customAmount={customAmount}
                  onCustomAmountChange={handleCustomAmountChange}
                  isCustomSelected={isCustomSelected}
                  onCustomSelect={handleCustomSelect}
                  donationType={donationType}
                />
                <Drawer open={isOpen} onOpenChange={setIsOpen}>
                  <DrawerTrigger asChild>
                    <DonateButton>DONATE MONTHLY</DonateButton>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader>
                      <DrawerTitle>Complete Your Donation</DrawerTitle>
                    </DrawerHeader>
                    <div className="flex-1 overflow-y-auto px-4 pb-4">
                      <DonationContent />
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </TabsContent>

            <TabsContent value="once">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Choose an amount to give
                </h3>
                <AmountSelector
                  amounts={[25, 50, 100, 250]}
                  selectedAmount={selectedAmount}
                  onAmountSelect={handleAmountSelect}
                  customAmount={customAmount}
                  onCustomAmountChange={handleCustomAmountChange}
                  isCustomSelected={isCustomSelected}
                  onCustomSelect={handleCustomSelect}
                  donationType={donationType}
                />
                <Drawer open={isOpen} onOpenChange={setIsOpen}>
                  <DrawerTrigger asChild>
                    <DonateButton>DONATE NOW</DonateButton>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader>
                      <DrawerTitle>Complete Your Donation</DrawerTitle>
                    </DrawerHeader>
                    <div className="flex-1 overflow-y-auto px-4 pb-4">
                      <DonationContent />
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center space-y-2 border-t border-dashed border-gray-200 pt-4 mt-5">
            <p className="text-xs text-gray-500">
              🔒 Your donation is secure and will be used to support our
              mission.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              GIVE ONCE
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="text-sm font-medium data-[state=active]:bg-yellow-400"
            >
              MONTHLY
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Choose an amount to give per month
              </h3>
              <AmountSelector
                amounts={[10, 20, 40, 100]}
                selectedAmount={selectedAmount}
                onAmountSelect={handleAmountSelect}
                customAmount={customAmount}
                onCustomAmountChange={handleCustomAmountChange}
                isCustomSelected={isCustomSelected}
                onCustomSelect={handleCustomSelect}
                donationType={donationType}
              />
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <DonateButton>DONATE MONTHLY</DonateButton>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-full sm:max-w-md h-full"
                >
                  <SheetHeader className="flex-shrink-0 border-b border-gray-200 pb-5">
                    <SheetTitle>Complete Your Donation</SheetTitle>
                    <SheetDescription>
                      Please fill in the form below to complete your donation.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="h-full overflow-y-auto py-4">
                    <DonationContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </TabsContent>

          <TabsContent value="once">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Choose an amount to give
              </h3>
              <AmountSelector
                amounts={[25, 50, 100, 250]}
                selectedAmount={selectedAmount}
                onAmountSelect={handleAmountSelect}
                customAmount={customAmount}
                onCustomAmountChange={handleCustomAmountChange}
                isCustomSelected={isCustomSelected}
                onCustomSelect={handleCustomSelect}
                donationType={donationType}
              />
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <DonateButton>DONATE NOW</DonateButton>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-full sm:max-w-md h-full"
                >
                  <SheetHeader className="flex-shrink-0 border-b border-gray-200 pb-5">
                    <SheetTitle>Complete Your Donation</SheetTitle>
                  </SheetHeader>
                  <div className="h-full overflow-y-auto py-4">
                    <DonationContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </TabsContent>
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
