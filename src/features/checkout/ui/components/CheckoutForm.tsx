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
  checkoutFormSchema,
  type CheckoutFormData,
  type CheckoutFormInput,
  type AddressInput,
  type UserWithAddresses,
} from "../../schemas/checkout-form";
import UserForm from "./user-form";
import CheckOutAddress from "./AddressForm";

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
  const [selectedAddress, setSelectedAddress] = useState<{
    id: string;
    fullName: string;
    address: string;
    landmark: string;
    city: string;
    country: string;
  } | null>(null);

  // Use refs to track the latest callback values without causing rerenders
  const callbacksRef = useRef({
    onFormValidChange,
    onFormDataChange,
    onShippingAddressChange,
  });

  // Update refs when callbacks change
  callbacksRef.current.onFormValidChange = onFormValidChange;
  callbacksRef.current.onFormDataChange = onFormDataChange;
  callbacksRef.current.onShippingAddressChange = onShippingAddressChange;

  const trpc = useTRPC();

  const form = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      deliveryMethod: "local_delivery",
      orderNotes: "",
    },
    mode: "onChange",
  });


  // Watch form changes with stable dependencies
  const deliveryMethod = form.watch("deliveryMethod");
  const orderNotes = form.watch("orderNotes");
  const isValid = form.formState.isValid;


  return (
    <div className="space-y-6">
      {/* Address Selection */}
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
          {/* <Card className="bg-gray-50 py-4">
            <CardContent>
              <UserForm control={form.control} />
            </CardContent>
          </Card> */}

          {/* Delivery Method Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5" />
                Delivery Method
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                        <div className="flex items-center space-x-3 p-3 border rounded-lg">
                          <RadioGroupItem
                            value="local_delivery"
                            id="delivery"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor="delivery"
                              className="font-medium cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                Local Delivery
                              </div>
                            </label>
                            <p className="text-sm text-muted-foreground mt-1">
                              We'll deliver to your address
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 border rounded-lg">
                          <RadioGroupItem value="pickup" id="pickup" />
                          <div className="flex-1">
                            <label
                              htmlFor="pickup"
                              className="font-medium cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Store Pickup
                              </div>
                            </label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Pick up from our store location
                            </p>
                          </div>
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
