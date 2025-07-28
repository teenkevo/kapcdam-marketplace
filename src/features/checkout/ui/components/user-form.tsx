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

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
}

interface Props {
  control: Control<FormData>;
  isPending?: boolean;
}

const UserForm = ({ control, isPending = false }: Props) => {
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
    </div>
  );
};

export default UserForm;
