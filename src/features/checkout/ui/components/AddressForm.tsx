"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { PhoneInput } from "@/components/ui/phone-input";
import { addressSchema, type AddressInput } from "../../schemas/checkout-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

export default function AddressForm({}) {
  const form = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "home",
      phone: "",
      address: "",
      landmark: "",
      city: "",
      country: "",
      deliveryInstructions: "",
      isDefault: false,
    },
  });

  const trpc = useTRPC();
  const { mutate: addAddress, isPending } = useMutation(
    trpc.user.addAddress.mutationOptions()
  );

  const handleFormSubmit = (data: AddressInput) => {
    const validateData = addressSchema.parse(data);

    addAddress({
      ...validateData,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Add New Address</h3>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Address Type</FormLabel>

                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={false}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="select addresss type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Contact Phone</FormLabel>
                <FormControl>
                  <PhoneInput
                    defaultCountry="UG"
                    disabled={isPending}
                    placeholder="Enter phone number for delivery contact"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Complete Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Complete Address</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter your full street address"
                    disabled={isPending}
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Landmark */}
          <FormField
            control={form.control}
            name="landmark"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nearest Landmark</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Apartment, suite, nearest landmark, etc"
                    disabled={isPending}
                    rows={1}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City/Area</FormLabel>
                <FormControl>
                  <Input
                    placeholder="City or locality"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Country (readonly) */}
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input {...field} value={"Uganda"} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Delivery Instructions */}
          <FormField
            control={form.control}
            name="deliveryInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Extra delivery details (e.g., "Blue gate", "Security code: 1234")'
                    disabled={isPending}
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Set as Default */}
          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Set as default address</FormLabel>
                </div>
              </FormItem>
            )}
          />

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Saving..." : "Save Address"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
