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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type z from "zod";
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit } from "lucide-react";
import { type AddressInput, addressSchema } from "../../schemas/checkout-form";
import { AddressSkeleton } from "./checkout-skeleton";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

// Use the shared address schema
export const addressFormSchema = addressSchema;

type NewAddressFormProps = {
  editingAddress?: z.infer<typeof addressFormSchema> | null;
  onSubmitSuccess?: () => void;
};

// This form is now used inside the dialog
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

  useEffect(() => {
    form.reset(
      editingAddress
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
          }
    );
  }, [editingAddress, form]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: createAddress, isPending: isCreating } = useMutation(
    trpc.addresses.createAddress.mutationOptions()
  );
  const { mutate: updateAddress, isPending: isUpdating } = useMutation(
    trpc.addresses.updateAddress.mutationOptions()
  );
  const isPending = isCreating || isUpdating;

  const handleFormSubmit = (data: z.infer<typeof addressFormSchema>) => {
    const transformedData = {
      ...data,
      landmark: data.landmark || undefined,
      city: data.city || undefined,
      deliveryInstructions: data.deliveryInstructions || undefined,
    };

    const mutationOptions = {
      onSuccess: () => {
        toast.success(
          `Address ${editingAddress ? "updated" : "saved"} successfully!`
        );
        queryClient.invalidateQueries(
          trpc.addresses.getUserAddresses.queryOptions()
        );
        onSubmitSuccess?.();
      },
      onError: (error: any) => {
        toast.error(
          `Failed to ${editingAddress ? "update" : "save"} address. Please try again.`
        );
      },
    };

    if (editingAddress?._id) {
      updateAddress(
        { addressId: editingAddress._id, ...transformedData },
        mutationOptions
      );
    } else {
      createAddress(transformedData, mutationOptions);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-5 pt-4"
      >
        <div className="space-y-5 max-h-[60vh] overflow-y-auto px-1">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Address Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isPending}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select address type" />
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
                    placeholder="Enter phone number"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
          <FormField
            control={form.control}
            name="landmark"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nearest Landmark</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g. Apartment, suite, nearest landmark"
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
          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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
        </div>
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent"
            onClick={onSubmitSuccess}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Saving..." : "Save Address"}
          </Button>
        </div>
      </form>
    </Form>
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressInput | null>(
    null
  );

  const trpc = useTRPC();
  const { data: userAddresses, isLoading } = useQuery(
    trpc.addresses.getUserAddresses.queryOptions()
  ) as {
    data: Array<AddressInput> | undefined;
    isLoading: boolean;
  };

  const createAddressData = useCallback((addr: any): AddressInput => {
    return {
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
    };
  }, []);

  useEffect(() => {
    if (userAddresses && !selectedAddress) {
      const defaultAddr = userAddresses.find((address) => address.isDefault);
      if (defaultAddr) {
        setSelectedAddress(createAddressData(defaultAddr));
      } else if (userAddresses.length > 0) {
        // If no default, select the first one
        setSelectedAddress(createAddressData(userAddresses[0]));
      }
    }
  }, [userAddresses, selectedAddress, setSelectedAddress, createAddressData]);

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setIsFormOpen(true);
  };

  const handleEditAddress = (address: AddressInput) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return <AddressSkeleton />;
  }

  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <div className="space-y-4">
        <RadioGroup
          value={selectedAddress?._id}
          onValueChange={(addressId) => {
            const newSelectedAddress = userAddresses?.find(
              (addr) => addr._id === addressId
            );
            if (newSelectedAddress) {
              setSelectedAddress(createAddressData(newSelectedAddress));
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {userAddresses?.map((address) => (
            <div key={address._id}>
              <RadioGroupItem
                value={address._id || ""}
                id={address._id || ""}
                className="sr-only"
              />
              <Label
                htmlFor={address._id}
                className={`relative block p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                  selectedAddress?._id === address._id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-primary/5 hover:border-primary/50"
                }`}
              >
                {address.isDefault && (
                  <span className="absolute top-2 right-2 text-xs bg-black text-white px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
                <div className="font-semibold capitalize mb-4">
                  {address.label} Address
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">
                    {address.fullName}
                  </p>
                  <p>
                    {address.address}
                    {address.city && <span>, {address.city}</span>}{" "}
                  </p>
                  <p>{address.phone}</p>
                </div>
                <div className="text-right mt-3">
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditAddress(address);
                    }}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </Label>
            </div>
          ))}

          <div
            className="flex items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors min-h-[180px]"
            onClick={handleAddNewAddress}
          >
            <div className="text-center text-slate-500">
              <Plus className="mx-auto h-8 w-8 mb-2" />
              <span className="font-semibold">Add a new address</span>
            </div>
          </div>
        </RadioGroup>
      </div>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {editingAddress
              ? "Edit Shipping Address"
              : "Add a New Shipping Address"}
          </DialogTitle>
        </DialogHeader>
        <NewAddressForm
          editingAddress={editingAddress}
          onSubmitSuccess={() => setIsFormOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
