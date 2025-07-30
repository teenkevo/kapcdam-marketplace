/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { User, MapPin, Plus, Truck, Package, FileText } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  type CheckoutFormData,
  type CheckoutFormInput,
  type AddressInput,
} from "../../schemas/checkout-form";
import UserForm from "./user-form";
import CheckOutAddress from "./AddressForm";
import { LiaShippingFastSolid } from "react-icons/lia";
import { MdStorefront } from "react-icons/md";
import { DeliveryZoneSelector } from "@/features/delivery/ui/components/delivery-zone-selector";

interface CheckoutFormProps {
  onFormValidChange: (isValid: boolean) => void;
  onFormDataChange: (data: CheckoutFormData) => void;
  onShippingAddressChange: (address: AddressInput) => void;
}

export default function CheckoutForm({
  onFormValidChange,
  onFormDataChange,
  onShippingAddressChange,
}: CheckoutFormProps) {
  const [selectedAddress, setSelectedAddress] = useState<AddressInput | null>(
    null
  );

  // State for selected delivery zone
  const [selectedDeliveryZone, setSelectedDeliveryZone] = useState<{
    _id: string;
    zoneName: string;
    fee: number;
    estimatedDeliveryTime: string;
  } | null>(null);

  const trpc = useTRPC();

  const form = useForm<{
    deliveryMethod: "pickup" | "local_delivery";
    paymentMethod: "pesapal" | "cod";
  }>({
    defaultValues: {
      deliveryMethod: "local_delivery",
      paymentMethod: "pesapal",
    },
    mode: "onChange",
  });

  // Watch form changes with stable dependencies
  const deliveryMethod = form.watch("deliveryMethod");
  const paymentMethod = form.watch("paymentMethod");
  const isValid = form.formState.isValid;

  // Process form data changes
  useEffect(() => {
    // For local delivery, require a delivery zone to be selected
    const isFormValid =
      isValid &&
      !!selectedAddress &&
      !!selectedAddress._id && // Ensure address has an ID
      (deliveryMethod === "pickup" || !!selectedDeliveryZone);

    onFormValidChange(isFormValid);

    if (isFormValid && selectedAddress && selectedAddress._id) {
      const formData: CheckoutFormData = {
        selectedAddress: { addressId: selectedAddress._id }, // Transform to addressId format
        deliveryMethod,
        paymentMethod,
        selectedDeliveryZone:
          deliveryMethod === "pickup" ? null : selectedDeliveryZone,
      };

      console.log("Checkout form data:", formData); // Debug log
      onFormDataChange(formData);
      onShippingAddressChange(selectedAddress);
    }
  }, [
    isValid,
    selectedAddress,
    deliveryMethod,
    paymentMethod,
    selectedDeliveryZone,
    onFormValidChange,
    onFormDataChange,
    onShippingAddressChange,
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4">
          <CheckOutAddress
            selectedAddress={selectedAddress}
            setSelectedAddress={setSelectedAddress}
          />
        </CardContent>
      </Card>

      {/* User Information Display */}

      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardContent className="py-4 space-y-4">
              <div className="flex w-full justify-between items-center">
                <h4 className="text-xl font-semibold">Delivery Method</h4>
              </div>
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
                        <div
                          className={`flex items-center space-x-3 border rounded-lg transition-all cursor-pointer ${
                            field.value === "local_delivery"
                              ? "border-[#C5F82A/]/50 bg-[#C5F82A]/5 ring-1 ring-[#C5F82A]/20"
                              : "hover:bg-[#C5F82A]/5 hover:border-[#C5F82A]/50 hover:ring-1 hover:ring-[#C5F82A]/10"
                          }`}
                        >
                          <RadioGroupItem
                            value="local_delivery"
                            id="local_delivery"
                            className="sr-only"
                          />

                          <label
                            htmlFor="local_delivery"
                            className="font-medium cursor-pointer flex-1 p-3"
                          >
                            <div className="flex w-full justify-between items-center gap-2">
                              Local Delivery
                              <LiaShippingFastSolid
                                className={`size-4 ${
                                  field.value === "local_delivery"
                                    ? "text-[#C5F82A]"
                                    : ""
                                }`}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              We'll deliver to your address
                            </p>
                          </label>
                        </div>

                        <div
                          className={`flex items-center space-x-3 border rounded-lg transition-all cursor-pointer ${
                            field.value === "pickup"
                              ? "border-[#C5F82A/]/50 bg-[#C5F82A]/5 ring-1 ring-[#C5F82A]/20"
                              : "hover:bg-[#C5F82A]/5 hover:border-[#C5F82A]/50 hover:ring-1 hover:ring-[#C5F82A]/10"
                          }`}
                        >
                          <RadioGroupItem
                            value="pickup"
                            id="pickup"
                            className="sr-only"
                          />

                          <label
                            htmlFor="pickup"
                            className="font-medium cursor-pointer flex-1 p-3 "
                          >
                            <div className="flex w-full justify-between items-center gap-2">
                              Pick up
                              <MdStorefront
                                className={`size-4 ${
                                  field.value === "pickup"
                                    ? "text-[#C5F82A]"
                                    : ""
                                }`}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Pick up from our offices
                            </p>
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Delivery Zones */}
          <DeliveryZoneSelector
            selectedAddress={selectedAddress}
            selectedZone={selectedDeliveryZone}
            onZoneSelect={setSelectedDeliveryZone}
            deliveryMethod={deliveryMethod}
          />

          {/* Payment Method */}
          <Card>
            <CardContent className="py-4 space-y-4">
              <div className="flex w-full justify-between items-center">
                <h4 className="text-xl font-semibold">Payment Method</h4>
              </div>
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
                          className={`flex items-center space-x-3 border rounded-lg transition-all cursor-pointer ${
                            field.value === "pesapal"
                              ? "border-[#C5F82A/]/50 bg-[#C5F82A]/5 ring-1 ring-[#C5F82A]/20"
                              : "hover:bg-[#C5F82A]/5 hover:border-[#C5F82A]/50 hover:ring-1 hover:ring-[#C5F82A]/10"
                          }`}
                        >
                          <RadioGroupItem
                            value="pesapal"
                            id="pesapal"
                            className="sr-only"
                          />

                          <label
                            htmlFor="pesapal"
                            className="font-medium cursor-pointer flex-1 p-3"
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
                          className={`flex items-center space-x-3 border rounded-lg transition-all cursor-pointer ${
                            field.value === "cod"
                              ? "border-[#C5F82A] bg-[#C5F82A]/10 ring-2 ring-[#C5F82A]/30"
                              : "hover:bg-[#C5F82A]/5 hover:border-[#C5F82A]/50 hover:ring-1 hover:ring-[#C5F82A]/20"
                          }`}
                        >
                          <RadioGroupItem
                            value="cod"
                            id="cod"
                            className="sr-only"
                          />

                          <label
                            htmlFor="cod"
                            className="font-medium cursor-pointer flex-1 p-3"
                          >
                            <div className="flex w-full justify-between items-center gap-2">
                              Cash on Delivery
                              <Package
                                className={`size-4 ${
                                  field.value === "cod" ? "text-[#C5F82A]" : ""
                                }`}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Pay with cash when your order arrives
                            </p>
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
