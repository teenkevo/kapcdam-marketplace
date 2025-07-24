"use client";

import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { Control } from "react-hook-form";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidPhoneNumber } from "react-phone-number-input";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface PersonalInfoFormProps {
  control: Control<FormData>;
  isPending?: boolean;
}

export default function PersonalInfoForm({
  control,
  isPending = false,
}: PersonalInfoFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Your Information</h3>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="firstName"
          rules={{
            required: "Required",
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>First Name</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder="First Name"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="lastName"
          rules={{
            required: "Required",
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Last Name</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder="Last Name"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="email"
        rules={{
          required: "Required",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Please enter a valid email address",
          },
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Email Address</FormLabel>
            <FormControl>
              <Input
                autoComplete="off"
                type="email"
                placeholder="Email Address"
                disabled={isPending}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="phone"
        rules={{
          required: "Required",
          validate: (value) =>
            isValidPhoneNumber(value || "") || "Invalid phone number",
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone number</FormLabel>
            <FormControl>
              <PhoneInput
                autoComplete="off"
                defaultCountry="UG"
                disabled={isPending}
                placeholder="Enter a phone number e.g. +256 792 445002"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
