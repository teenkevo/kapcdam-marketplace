/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Package } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";

import type {
  CheckoutFormData,
  AddressInput,
} from "../../schemas/checkout-form";
import CheckOutAddress from "./AddressForm";
import { LiaShippingFastSolid } from "react-icons/lia";
import { MdStorefront } from "react-icons/md";
import { DeliveryZoneSelector } from "@/features/delivery/ui/components/delivery-zone-selector";
import { analyzeCartComposition } from "@/features/cart/helpers";

interface CheckoutFormProps {
  onFormValidChange: (isValid: boolean) => void;
  onFormDataChange: (data: CheckoutFormData) => void;
  onShippingAddressChange: (address: AddressInput) => void;
  cartId: string;
}

export default function CheckoutForm({
  onFormValidChange,
  onFormDataChange,
  onShippingAddressChange,
  cartId,
}: CheckoutFormProps) {
  const [activeStep, setActiveStep] = useState("step-1"); // Start with Shipping Address
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const [selectedAddress, setSelectedAddress] = useState<AddressInput | null>(
    null
  );
  const [selectedDeliveryZone, setSelectedDeliveryZone] = useState<{
    _id: string;
    zoneName: string;
    fee: number;
    estimatedDeliveryTime: string;
  } | null>(null);
  const trpc = useTRPC();
  const { data: userCart } = useQuery(
    trpc.cart.getCartById.queryOptions({ cartId })
  );

  const cartComposition = analyzeCartComposition(userCart?.cartItems || []);
  const shouldShowDeliveryOptions = !cartComposition.isCoursesOnly;

  const form = useForm<{
    deliveryMethod: "pickup" | "local_delivery";
    paymentMethod: "pesapal" | "cod";
  }>({
    defaultValues: {
      deliveryMethod: shouldShowDeliveryOptions ? "local_delivery" : "pickup",
      paymentMethod: "pesapal",
    },
    mode: "onChange",
  });

  const deliveryMethod = form.watch("deliveryMethod");
  const paymentMethod = form.watch("paymentMethod");
  const isValid = form.formState.isValid;

  // Effect to update form data and validity
  useEffect(() => {
    const isFormValid =
      isValid &&
      !!selectedAddress &&
      !!selectedAddress._id &&
      (deliveryMethod === "pickup" ||
        !shouldShowDeliveryOptions ||
        !!selectedDeliveryZone);

    onFormValidChange(isFormValid);

    if (isFormValid && selectedAddress && selectedAddress._id) {
      const formData: CheckoutFormData = {
        selectedAddress: { addressId: selectedAddress._id },
        deliveryMethod: shouldShowDeliveryOptions ? deliveryMethod : "pickup",
        paymentMethod,
        selectedDeliveryZone:
          deliveryMethod === "pickup" || !shouldShowDeliveryOptions
            ? null
            : selectedDeliveryZone,
      };
      onFormDataChange(formData);
      onShippingAddressChange(selectedAddress);
    }
  }, [
    isValid,
    selectedAddress,
    deliveryMethod,
    paymentMethod,
    selectedDeliveryZone,
    shouldShowDeliveryOptions,
    onFormValidChange,
    onFormDataChange,
    onShippingAddressChange,
  ]);

  // Effect to mark step-1 as completed when selectedAddress is available
  useEffect(() => {
    if (selectedAddress && !completedSteps.includes("step-1")) {
      setCompletedSteps((prev) => [...new Set([...prev, "step-1"])]);
    } else if (!selectedAddress && completedSteps.includes("step-1")) {
      // If address is unselected, remove step-1 from completed
      setCompletedSteps((prev) => prev.filter((step) => step !== "step-1"));
    }
  }, [selectedAddress, completedSteps]);

  const handleStepCompletion = (step: string, nextStep: string) => {
    setCompletedSteps((prev) => [...new Set([...prev, step])]);
    setActiveStep(nextStep);
  };

  const StepHeader = ({
    stepNumber,
    title,
    summary,
  }: {
    stepNumber: number;
    title: string;
    summary: string | null;
  }) => {
    const stepId = `step-${stepNumber}`;
    const isCompleted = completedSteps.includes(stepId);
    const isActive = activeStep === stepId;

    return (
      <div className="flex flex-col w-full">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <span className="text-xl font-medium text-gray-400">
              {stepNumber}.
            </span>
            <span className="text-xl font-bold">{title}</span>
          </div>
          {isCompleted && !isActive && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setActiveStep(stepId);
              }}
              className="p-0 mr-4 underline h-auto text-base text-primary cursor-pointer hover:text-primary/80"
            >
              Edit
            </span>
          )}
        </div>
        {isCompleted && !isActive && summary && (
          <div className="mt-2 ml-7">
            <span className="text-sm text-muted-foreground">{summary}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Form {...form}>
      <Accordion
        type="single"
        value={activeStep}
        onValueChange={(value) => value && setActiveStep(value)}
        collapsible
        className="w-full space-y-0"
      >
        {/* Step 1: Shipping Address */}
        <AccordionItem value="step-1" className="border-b">
          <AccordionTrigger className="py-5 hover:no-underline">
            {" "}
            {/* Reduced vertical padding */}
            <StepHeader
              stepNumber={1}
              title="Shipping Address"
              summary={
                selectedAddress
                  ? `${selectedAddress.fullName}, ${selectedAddress.address}`
                  : null
              }
            />
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6">
            {" "}
            {/* Adjusted padding */}
            <CheckOutAddress
              selectedAddress={selectedAddress}
              setSelectedAddress={setSelectedAddress}
            />
            <Button
              onClick={() =>
                handleStepCompletion(
                  "step-1",
                  shouldShowDeliveryOptions ? "step-2" : "step-3"
                )
              }
              disabled={!selectedAddress}
              className="mt-6 w-full" // Full width button
            >
              Continue to {shouldShowDeliveryOptions ? "Delivery" : "Payment"}
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Step 2: Delivery - only show for carts with products */}
        {shouldShowDeliveryOptions && (
          <AccordionItem
            value="step-2"
            className="border-b"
            disabled={!completedSteps.includes("step-1")}
          >
            <AccordionTrigger className="py-5 hover:no-underline">
              {" "}
              {/* Reduced vertical padding */}
              <StepHeader
                stepNumber={2}
                title="Delivery"
                summary={
                  deliveryMethod === "pickup" ? "Pick up" : "Local Delivery"
                }
              />
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-6">
              {" "}
              {/* Adjusted padding */}
              <FormField
                control={form.control}
                name="deliveryMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="space-y-3"
                      >
                        <label
                          htmlFor="local_delivery"
                          className={`flex items-center space-x-3 border rounded-lg transition-all cursor-pointer p-4 w-full ${
                            field.value === "local_delivery"
                              ? "border-primary bg-primary/5"
                              : "hover:bg-primary/5 hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem
                            value="local_delivery"
                            id="local_delivery"
                            className="sr-only"
                          />
                          <div className="font-medium cursor-pointer flex-1">
                            <div className="flex w-full justify-between items-center gap-2">
                              Local Delivery
                              <LiaShippingFastSolid
                                className={`size-4 ${field.value === "local_delivery" ? "text-primary" : "text-muted-foreground"}`}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              We'll deliver to your address
                            </p>
                          </div>
                        </label>
                        <label
                          htmlFor="pickup"
                          className={`flex items-center space-x-3 border rounded-lg transition-all cursor-pointer p-4 w-full ${
                            field.value === "pickup"
                              ? "border-primary bg-primary/5"
                              : "hover:bg-primary/5 hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem
                            value="pickup"
                            id="pickup"
                            className="sr-only"
                          />
                          <div className="font-medium cursor-pointer flex-1">
                            <div className="flex w-full justify-between items-center gap-2">
                              Pick up
                              <MdStorefront
                                className={`size-4 ${field.value === "pickup" ? "text-primary" : "text-muted-foreground"}`}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Pick up from our offices
                            </p>
                          </div>
                        </label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DeliveryZoneSelector
                selectedAddress={selectedAddress}
                selectedZone={selectedDeliveryZone}
                onZoneSelect={setSelectedDeliveryZone}
                deliveryMethod={deliveryMethod}
              />
              <Button
                onClick={() => handleStepCompletion("step-2", "step-3")}
                disabled={
                  deliveryMethod === "local_delivery" && !selectedDeliveryZone
                }
                className="w-full" // Full width button
              >
                Continue to Payment
              </Button>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Step 3: Payment */}
        <AccordionItem
          value="step-3"
          className="border-b"
          disabled={
            !completedSteps.includes(
              shouldShowDeliveryOptions ? "step-2" : "step-1"
            )
          }
        >
          <AccordionTrigger className="py-5 hover:no-underline">
            {" "}
            {/* Reduced vertical padding */}
            <StepHeader
              stepNumber={shouldShowDeliveryOptions ? 3 : 2} // Adjust step number based on delivery options
              title="Payment"
              summary={
                paymentMethod === "cod"
                  ? shouldShowDeliveryOptions
                    ? "Cash on Delivery"
                    : "Pay on site"
                  : "Pesapal"
              }
            />
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-6">
            {" "}
            {/* Adjusted padding */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="space-y-3"
                    >
                      <div
                        className={`flex items-center space-x-3 border rounded-lg transition-all cursor-pointer p-4 ${
                          // Increased padding
                          field.value === "pesapal"
                            ? "border-primary bg-primary/5" // Simpler active state
                            : "hover:bg-primary/5 hover:border-primary/50" // Simpler hover state
                        }`}
                      >
                        <RadioGroupItem
                          value="pesapal"
                          id="pesapal"
                          className="sr-only"
                        />
                        <label
                          htmlFor="pesapal"
                          className="font-medium cursor-pointer flex-1"
                        >
                          <div className="flex w-full justify-between items-center gap-2">
                            <div>
                              <div className="font-medium">Pesapal</div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Pay with mobile money or card
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <img
                                src="/payment-methods/mtn.svg"
                                alt="MTN"
                                className="w-8 h-6 object-contain"
                              />
                              <img
                                src="/payment-methods/airtel.svg"
                                alt="Airtel"
                                className="w-8 h-6 object-contain"
                              />
                              <img
                                src="/payment-methods/visa.svg"
                                alt="Visa"
                                className="w-8 h-6 object-contain"
                              />
                              <img
                                src="/payment-methods/master.svg"
                                alt="Mastercard"
                                className="w-8 h-6 object-contain"
                              />
                            </div>
                          </div>
                        </label>
                      </div>
                      <div
                        className={`flex items-center space-x-3 border rounded-lg transition-all cursor-pointer p-4 ${
                          // Increased padding
                          field.value === "cod"
                            ? "border-primary bg-primary/5" // Simpler active state
                            : "hover:bg-primary/5 hover:border-primary/50" // Simpler hover state
                        }`}
                      >
                        <RadioGroupItem
                          value="cod"
                          id="cod"
                          className="sr-only"
                        />
                        <label
                          htmlFor="cod"
                          className="font-medium cursor-pointer flex-1"
                        >
                          <div className="flex w-full justify-between items-center gap-2">
                            {shouldShowDeliveryOptions
                              ? "Cash on Delivery"
                              : "Pay on site"}
                            <Package
                              className={`size-4 ${field.value === "cod" ? "text-primary" : "text-muted-foreground"}`}
                            />{" "}
                            {/* Consistent icon color */}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {shouldShowDeliveryOptions
                              ? "Pay with cash when your order arrives"
                              : "Pay at KAPCDAM when you come to take your course"}
                          </p>
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Form>
  );
}
