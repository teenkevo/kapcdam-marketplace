"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import z from "zod";
import { Card, CardHeader } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { nanoid } from "nanoid";

export const addressFormSchema = z.object({
  id: z.string(),
  label: z.enum(["home", "work", "other"], {
    required_error: "Address label is required",
  }),
  fullName: z.string(),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[+]?[0-9\s\-\(\)]{7,15}$/, "Enter a valid phone number"),
  address: z.string().min(1, "Address is required"),
  landmark: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Uganda"),
  deliveryInstructions: z.string().optional(),
  isDefault: z.boolean().default(false),
});

type NewAddressFormProps = {
  editingAddress?: z.infer<typeof addressFormSchema> | null;
  onSubmitSuccess?: () => void;
};

export function NewAddressForm({
  editingAddress,
  onSubmitSuccess,
}: NewAddressFormProps) {
  const form = useForm<z.infer<typeof addressFormSchema>>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: editingAddress || {
      id: "", // Will be generated during submission
      label: "home",
      fullName: "",
      phone: "",
      address: "",
      landmark: "",
      city: "",
      country: "Uganda",
      deliveryInstructions: "",
      isDefault: false,
    },
  });

  // Update form values when editingAddress changes
  useEffect(() => {
    if (editingAddress) {
      form.reset(editingAddress);
    }
  }, [editingAddress, form]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate: addAddress, isPending } = useMutation(
    trpc.user.addAddress.mutationOptions()
  );

  const handleFormSubmit = (data: z.infer<typeof addressFormSchema>) => {
    try {
      console.log("Form submission data:", data);
      console.log("Editing address:", editingAddress);

      // Use existing ID for edit mode, or generate new ID for add mode
      const addressData = {
        ...data,
        id: editingAddress ? editingAddress.id : nanoid(10),
      };

      addAddress(addressData, {
        onSuccess: (result: any) => {
          console.log("Address operation successful:", result);
          queryClient.invalidateQueries(
            trpc.user.getUserAddresses.queryOptions()
          );
          onSubmitSuccess?.();
        },
        onError: (error: any) => {
          console.error("Address operation error:", error);
        },
      });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      {" "}
    
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-4"
      >
        <div className="space-y-4">
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
              {isPending
                ? editingAddress
                  ? "Updating..."
                  : "Saving..."
                : editingAddress
                  ? "Update Address"
                  : "Save Address"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

type AddressCardProps = {
  addressDetails: {
    id: string;
    fullName: string;
    address: string;
    landmark: string;
    city: string;
    country: string;
    label?: string;
    phone?: string;
    isDefault?: boolean;
  };
  showAddressOptions: () => void;
};

export function AddressCard({
  addressDetails,
  showAddressOptions,
}: AddressCardProps) {
  const { address, landmark, city, country, label, phone, isDefault } =
    addressDetails;
  return (
    <div className="space-y-4">
      <div className="flex w-full justify-between items-center">
        <h4 className="text-xl font-semibold">
          {"Delivering to " + addressDetails.fullName}
        </h4>
        <Button variant={"link"} onClick={showAddressOptions}>
          Change
        </Button>
      </div>

      {/* Address details card similar to selection cards */}
      <div className="p-3 border rounded bg-gray-50">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm capitalize">
              {label && (
                <span>
                  {label} Address
                  {isDefault && (
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      Default
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="text-sm font-medium">{addressDetails.fullName}</div>
          </div>
          <div className="text-sm text-muted-foreground">
            {[address, landmark, city, country]
              .filter(
                (part): part is string =>
                  part !== undefined && part !== null && part.trim() !== ""
              )
              .map((part) => part.trim())
              .join(", ")}
          </div>
          {phone && (
            <div className="text-sm text-muted-foreground">Phone: {phone}</div>
          )}
        </div>
      </div>
    </div>
  );
}

type CheckOutAddressProps = {
  selectedAddress: {
    id: string;
    fullName: string;
    address: string;
    landmark: string;
    city: string;
    country: string;
    label?: string;
    phone?: string;
    isDefault?: boolean;
  } | null;
  setSelectedAddress: (
    address: {
      id: string;
      fullName: string;
      address: string;
      landmark: string;
      city: string;
      country: string;
      label?: string;
      phone?: string;
      isDefault?: boolean;
    } | null
  ) => void;
};

export default function CheckOutAddress({
  selectedAddress,
  setSelectedAddress,
}: CheckOutAddressProps) {
  const [showAddresses, setShowAdresses] = useState<boolean>(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState<boolean>(false);
  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<z.infer<
    typeof addressFormSchema
  > | null>(null);

  const [tempSelectedAddress, setTempSelectedAddress] = useState<{
    id: string;
    fullName: string;
    address: string;
    landmark: string;
    city: string;
    country: string;
    label?: string;
    phone?: string;
    isDefault?: boolean;
  } | null>(null);
  const trpc = useTRPC();
  const { data: userAddresses, isLoading } = useQuery(
    trpc.user.getUserAddresses.queryOptions()
  ) as {
    data: { addresses: z.infer<typeof addressFormSchema>[] } | undefined;
    isLoading: boolean;
  };

  console.log(userAddresses);

  // Set default address when query completes
  useEffect(() => {
    if (userAddresses?.addresses && !selectedAddress) {
      const defaultAddr = userAddresses?.addresses?.filter(
        (address) => address.isDefault
      )[0];

      const addressData = {
        id: defaultAddr.id,
        fullName: defaultAddr.fullName,
        address: defaultAddr.address,
        landmark: defaultAddr.landmark || "",
        city: defaultAddr.city || "",
        country: defaultAddr.country,
        label: defaultAddr.label,
        phone: defaultAddr.phone,
        isDefault: defaultAddr.isDefault,
      };

      setSelectedAddress(addressData);
      setTempSelectedAddress(addressData);
    }
  }, [userAddresses, selectedAddress, setSelectedAddress]);

  // Update tempSelectedAddress when selectedAddress changes
  useEffect(() => {
    if (selectedAddress && !tempSelectedAddress) {
      setTempSelectedAddress(selectedAddress);
    }
  }, [selectedAddress, tempSelectedAddress]);

  useEffect(() => {
    if (userAddresses?.addresses && tempSelectedAddress) {
      const updatedAddress = userAddresses.addresses.find(
        (addr) => addr.id === tempSelectedAddress.id
      );

      if (updatedAddress) {
        setTempSelectedAddress({
          id: updatedAddress.id,
          fullName: updatedAddress.fullName,
          address: updatedAddress.address,
          landmark: updatedAddress.landmark || "",
          city: updatedAddress.city || "",
          country: updatedAddress.country,
          label: updatedAddress.label,
          phone: updatedAddress.phone,
          isDefault: updatedAddress.isDefault,
        });
      }
    }
  }, [userAddresses?.addresses, tempSelectedAddress?.id, tempSelectedAddress]);

  const handleSaveAddress = () => {
    if (tempSelectedAddress) {
      setSelectedAddress(tempSelectedAddress);
    }
    setShowAdresses(false);
    setShowNewAddressForm(false);
  };

  const handleCancelSelection = () => {
    setTempSelectedAddress(selectedAddress);
    setShowAdresses(false);
    setShowNewAddressForm(false);
  };

  const handleAddressSelect = (address: z.infer<typeof addressFormSchema>) => {
    setTempSelectedAddress({
      id: address.id,
      fullName: address.fullName,
      address: address.address,
      landmark: address.landmark || "",
      city: address.city || "",
      country: address.country,
      label: address.label,
      phone: address.phone,
      isDefault: address.isDefault,
    });
  };

  const handleEditAddressFromSelector = (
    address: z.infer<typeof addressFormSchema>
  ) => {
    if (userAddresses?.addresses) {
      setEditingAddress(address);
      setShowEditForm(true);

    }
  };

  const handleEditFormSuccess = () => {
    setShowEditForm(false);
    setEditingAddress(null);
  };

  if (isLoading) {
    return <div>Loading addresses...</div>;
  }

  if (!userAddresses?.addresses || !selectedAddress) {
    return <NewAddressForm />;
  }

  if (!selectedAddress) {
    return <div>Setting up address...</div>;
  }

  return (
    <div className="w-full">
      {showAddresses ? (
        <div className="space-y-4">
          {showNewAddressForm ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Add New Address</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowNewAddressForm(false)}
                >
                  Back to addresses
                </Button>
              </div>
              <NewAddressForm
                onSubmitSuccess={() => setShowNewAddressForm(false)}
              />
            </div>
          ) : showEditForm ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Edit Address</h3>
                <Button variant="ghost" onClick={() => setShowEditForm(false)}>
                  Back to addresses
                </Button>
              </div>
              <NewAddressForm
                editingAddress={editingAddress}
                onSubmitSuccess={handleEditFormSuccess}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Select Address</h3>
              </div>

              {/* Address Cards */}
              <div className="space-y-2">
                {userAddresses?.addresses?.map(
                  (address: z.infer<typeof addressFormSchema>) => (
                    <div
                      key={address.id}
                      className={`p-3 border rounded transition-all cursor-pointer ${
                        tempSelectedAddress?.id === address.id
                          ? "border-[#C5F82A] bg-[#C5F82A]/10 ring-2 ring-[#C5F82A]/30"
                          : "hover:bg-[#C5F82A]/5 hover:border-[#C5F82A]/50 hover:ring-1 hover:ring-[#C5F82A]/20"
                      }`}
                      onClick={() => handleAddressSelect(address)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm capitalize">
                            {address.label} Address
                            {address.isDefault && (
                              <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium">
                            {address.fullName}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {[
                            address.address,
                            address.landmark,
                            address.city,
                            address.country,
                          ]
                            .filter(
                              (part): part is string =>
                                part !== undefined &&
                                part !== null &&
                                part.trim() !== ""
                            )
                            .map((part) => part.trim())
                            .join(", ")}
                        </div>
                        {address.phone && (
                          <div className="text-sm text-muted-foreground">
                            Phone: {address.phone}
                          </div>
                        )}
                        {/* Edit button for each address card */}
                        <div className="pt-2 border-t border-gray-200">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card selection
                              handleEditAddressFromSelector(address);
                            }}
                            className="h-auto p-0 text-sm text-gray-600 hover:text-gray-800"
                          >
                            Edit address
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {/* Add New Address Card */}
                <div
                  className="p-3 border border-dashed border-gray-300 rounded transition-all cursor-pointer hover:bg-[#C5F82A]/5 hover:border-[#C5F82A]/50 hover:ring-1 hover:ring-[#C5F82A]/20"
                  onClick={() => setShowNewAddressForm(true)}
                >
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <Plus className="w-4 h-4" />
                    <span>Add new address</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancelSelection}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAddress}
                  className="flex-1 bg-[#C5F82A] text-black hover:bg-[#B4E729]"
                  disabled={!tempSelectedAddress}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <AddressCard
          addressDetails={selectedAddress}
          showAddressOptions={() => setShowAdresses(true)}
        />
      )}
    </div>
  );
}
