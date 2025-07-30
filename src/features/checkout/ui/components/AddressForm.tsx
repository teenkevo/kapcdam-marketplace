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
import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Edit } from "lucide-react";
import { type AddressInput, addressSchema } from "../../schemas/checkout-form";
import { AddressSkeleton } from "./checkout-skeleton";
import { toast } from "sonner";

// Use the shared address schema
export const addressFormSchema = addressSchema;

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
    defaultValues: editingAddress
      ? {
          ...editingAddress,
          landmark: editingAddress.landmark || "",
          city: editingAddress.city || "",
          deliveryInstructions: editingAddress.deliveryInstructions || "",
        }
      : {
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
      form.reset({
        ...editingAddress,
        landmark: editingAddress.landmark || "",
        city: editingAddress.city || "",
        deliveryInstructions: editingAddress.deliveryInstructions || "",
      });
    }
  }, [editingAddress, form]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Use create or update mutation based on whether we're editing
  const { mutate: createAddress, isPending: isCreating } = useMutation(
    trpc.addresses.createAddress.mutationOptions()
  );

  const { mutate: updateAddress, isPending: isUpdating } = useMutation(
    trpc.addresses.updateAddress.mutationOptions()
  );

  const isPending = isCreating || isUpdating;

  const handleFormSubmit = (data: z.infer<typeof addressFormSchema>) => {
    try {
      console.log("Form submission data:", data);
      console.log("Editing address:", editingAddress);

      // Transform empty strings to undefined for TRPC compatibility
      const transformedData = {
        ...data,
        landmark: data.landmark || undefined,
        city: data.city || undefined,
        deliveryInstructions: data.deliveryInstructions || undefined,
      };

      if (editingAddress?._id) {
        // Update existing address
        updateAddress(
          {
            addressId: editingAddress._id,
            ...transformedData,
          },
          {
            onSuccess: (result: any) => {
              console.log("Address update successful:", result);
              toast.success("Address updated successfully!");
              queryClient.invalidateQueries(
                trpc.addresses.getUserAddresses.queryOptions()
              );
              onSubmitSuccess?.();
            },
            onError: (error: any) => {
              console.error("Address update error:", error);
              toast.error("Failed to update address. Please try again.");
            },
          }
        );
      } else {
        // Create new address
        createAddress(transformedData, {
          onSuccess: (result: any) => {
            console.log("Address creation successful:", result);
            toast.success("Address created successfully!");
            queryClient.invalidateQueries(
              trpc.addresses.getUserAddresses.queryOptions()
            );
            onSubmitSuccess?.();
          },
          onError: (error: any) => {
            console.error("Address creation error:", error);
            toast.error("Failed to create address. Please try again.");
          },
        });
      }
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

          {/* Full Name */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter full name for delivery"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
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
                    value={field.value || ""}
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
                    value={field.value || ""}
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
                    value={field.value || ""}
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
  addressDetails: AddressInput;
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
  selectedAddress: AddressInput | null;
  setSelectedAddress: (address: AddressInput | null) => void;
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

  const [tempSelectedAddress, setTempSelectedAddress] =
    useState<AddressInput | null>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: userAddresses, isLoading } = useQuery(
    trpc.addresses.getUserAddresses.queryOptions()
  ) as {
    data: Array<z.infer<typeof addressFormSchema>> | undefined;
    isLoading: boolean;
  };

  // Use refs to track the current values to avoid dependency issues
  const selectedAddressRef = useRef(selectedAddress);
  const tempSelectedAddressRef = useRef(tempSelectedAddress);

  // Update refs when state changes
  selectedAddressRef.current = selectedAddress;
  tempSelectedAddressRef.current = tempSelectedAddress;

  console.log("User Addresses", userAddresses);

  // Memoized function to create address data object
  const createAddressData = useCallback(
    (addr: any) => ({
      _id: addr._id,
      fullName: addr.fullName,
      address: addr.address,
      landmark: addr.landmark || "",
      city: addr.city || "",
      country: addr.country,
      label: addr.label,
      phone: addr.phone,
      deliveryInstructions: addr.deliveryInstructions || "",
      isDefault: addr.isDefault,
    }),
    []
  );

  // Set default address when query completes
  useEffect(() => {
    if (userAddresses && !selectedAddressRef.current) {
      const defaultAddr = userAddresses.find((address) => address.isDefault);

      if (defaultAddr) {
        const addressData = createAddressData(defaultAddr);
        setSelectedAddress(addressData);
        setTempSelectedAddress(addressData);
      }
    }
  }, [userAddresses, createAddressData, setSelectedAddress]);

  // Update tempSelectedAddress when selectedAddress changes
  useEffect(() => {
    if (selectedAddressRef.current && !tempSelectedAddressRef.current) {
      setTempSelectedAddress(selectedAddressRef.current);
    }
  }, [selectedAddress]);

  // Update tempSelectedAddress when userAddresses change (for real-time updates)
  useEffect(() => {
    if (userAddresses && tempSelectedAddressRef.current) {
      const updatedAddress = userAddresses.find(
        (addr) => addr._id === tempSelectedAddressRef.current?._id
      );

      if (updatedAddress) {
        const newAddressData = createAddressData(updatedAddress);

        // Only update if the data has actually changed
        const current = tempSelectedAddressRef.current;
        const hasChanged =
          current.fullName !== newAddressData.fullName ||
          current.address !== newAddressData.address ||
          current.landmark !== newAddressData.landmark ||
          current.city !== newAddressData.city ||
          current.phone !== newAddressData.phone ||
          current.isDefault !== newAddressData.isDefault;

        if (hasChanged) {
          setTempSelectedAddress(newAddressData);
        }
      }
    }
  }, [userAddresses, createAddressData]);

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
      _id: address._id,
      fullName: address.fullName,
      address: address.address,
      landmark: address.landmark || "",
      city: address.city || "",
      country: address.country,
      label: address.label,
      phone: address.phone,
      deliveryInstructions: address.deliveryInstructions || "",
      isDefault: address.isDefault,
    });
  };

  const handleEditAddressFromSelector = (
    address: z.infer<typeof addressFormSchema>
  ) => {
    if (userAddresses) {
      setEditingAddress(address);
      setShowEditForm(true);
    }
  };

  const handleEditFormSuccess = () => {
    setShowEditForm(false);
    setEditingAddress(null);
  };

  if (isLoading) {
    return <AddressSkeleton />;
  }

  if (!userAddresses || userAddresses.length === 0) {
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
                {userAddresses.map((address) => (
                  <div
                    key={address._id}
                    className={`p-3 border rounded transition-all cursor-pointer ${
                      tempSelectedAddress?._id === address._id
                        ? "border-[#C5F82A] bg-[#C5F82A]/10 ring-2 ring-[#C5F82A]/30"
                        : "hover:bg-[#C5F82A]/5 hover:border-[#C5F82A]/50 hover:ring-1 hover:ring-[#C5F82A]/20"
                    }`}
                    onClick={() =>
                      handleAddressSelect(
                        address as z.infer<typeof addressFormSchema>
                      )
                    }
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
                      {/* Action buttons for each address card */}
                      <div className="pt-2 border-t border-gray-200 flex items-center justify-end">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card selection
                            handleEditAddressFromSelector(
                              address as z.infer<typeof addressFormSchema>
                            );
                          }}
                          className="h-auto p-0 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

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
