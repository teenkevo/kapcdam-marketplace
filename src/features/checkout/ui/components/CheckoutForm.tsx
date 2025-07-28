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
import AddressCard from "./AddressCard";
import AddressForm from "./AddressForm";
import UserForm from "./user-form";

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
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);
  const [userWithAddresses, setUserWithAddresses] =
    useState<UserWithAddresses | null>(null);

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

  const { data: userData, isLoading: userLoading } = useQuery(
    trpc.user.getUserWithAddresses.queryOptions()
  );

  console.log("user Data", userData);

  const addAddressMutation = useMutation(
    trpc.user.addAddress.mutationOptions()
  );

  const updateAddressMutation = useMutation(
    trpc.user.updateAddressByIndex.mutationOptions()
  );

  const form = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      selectedAddressIndex: undefined,
      newAddress: undefined,
      deliveryMethod: "local_delivery",
      orderNotes: "",
    },
    mode: "onChange",
  });

  // Update local state when userData changes
  useEffect(() => {
    if (userData) {
      setUserWithAddresses(userData);

      // Find default address and pre-select it
      const defaultAddressIndex = userData.addresses?.findIndex(
        (addr) => addr.isDefault
      );
      if (defaultAddressIndex !== -1) {
        form.setValue("selectedAddressIndex", defaultAddressIndex);
        // Use ref to avoid dependency issues
        callbacksRef.current.onShippingAddressChange(
          userData.addresses[defaultAddressIndex]
        );
      }
    }
  }, [userData, form]);

  // Memoize the form data processing function
  const processFormData = useCallback(
    (
      selectedAddressIndex: number | undefined,
      deliveryMethod: string,
      orderNotes: string,
      isValid: boolean
    ) => {
      callbacksRef.current.onFormValidChange(isValid);

      if (
        isValid &&
        selectedAddressIndex !== undefined &&
        userWithAddresses?.addresses
      ) {
        const selectedAddress =
          userWithAddresses.addresses[selectedAddressIndex];

        if (selectedAddress) {
          const formData: CheckoutFormData = {
            selectedAddress,
            deliveryMethod: deliveryMethod as "pickup" | "local_delivery",
            orderNotes,
          };

          callbacksRef.current.onFormDataChange(formData);
          callbacksRef.current.onShippingAddressChange(selectedAddress);
        }
      }
    },
    [userWithAddresses?.addresses]
  );

  // Watch form changes with stable dependencies
  const selectedAddressIndex = form.watch("selectedAddressIndex");
  const deliveryMethod = form.watch("deliveryMethod");
  const orderNotes = form.watch("orderNotes");
  const isValid = form.formState.isValid;

  useEffect(() => {
    processFormData(selectedAddressIndex, deliveryMethod, orderNotes, isValid);
  }, [
    selectedAddressIndex,
    deliveryMethod,
    orderNotes,
    isValid,
    processFormData,
  ]);

  const handleAddressSelect = useCallback(
    (index: number) => {
      form.setValue("selectedAddressIndex", index);
      setShowAddNewAddress(false);
    },
    [form]
  );

  const handleAddNewAddress = useCallback(
    async (addressData: AddressInput) => {
      try {
        const result = await addAddressMutation.mutateAsync(addressData);
        setUserWithAddresses(result);

        // Select the newly added address (last in array)
        const newIndex = result.addresses.length - 1;
        form.setValue("selectedAddressIndex", newIndex);
        setShowAddNewAddress(false);

        toast.success("Address added successfully");
      } catch (error) {
        toast.error("Failed to add address");
        console.error("Add address error:", error);
      }
    },
    [addAddressMutation, form]
  );

  const handleEditAddress = useCallback(
    async (index: number, addressData: AddressInput) => {
      try {
        const result = await updateAddressMutation.mutateAsync({
          addressIndex: index,
          address: addressData,
        });
        setUserWithAddresses(result);
        toast.success("Address updated successfully");
      } catch (error) {
        toast.error("Failed to update address");
        console.error("Update address error:", error);
      }
    },
    [updateAddressMutation]
  );

  if (userLoading || !userWithAddresses) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasAddresses =
    userWithAddresses.addresses && userWithAddresses.addresses.length > 0;

  return (
    <div className="space-y-6">
      {/* User Information Display */}

      <Form {...form}>
        <form className="space-y-6">
          <Card className="bg-gray-50 py-4">
            <CardContent>
              <UserForm control={form.control} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasAddresses && (
                <FormField
                  control={form.control}
                  name="selectedAddressIndex"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          value={field.value?.toString() || ""}
                          onValueChange={(value) => {
                            const index = parseInt(value);
                            field.onChange(index);
                            handleAddressSelect(index);
                          }}
                          className="space-y-3"
                        >
                          {userWithAddresses.addresses.map((address, index) => (
                            <AddressCard
                              key={index}
                              address={address}
                              index={index}
                              isSelected={field.value === index}
                              onSelect={handleAddressSelect}
                              onEdit={handleEditAddress}
                              isLoading={updateAddressMutation.isPending}
                            />
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
           
              {!showAddNewAddress ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAddNewAddress(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Address
                </Button>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Add New Address</h4>
                      <AddressForm
                        onSubmit={handleAddNewAddress}
                        onCancel={() => setShowAddNewAddress(false)}
                        isLoading={addAddressMutation.isPending}
                        submitText="Add Address"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

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

          {/* Order Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Order Notes
                <span className="text-sm font-normal text-muted-foreground">
                  (Optional)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="orderNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Add any special instructions for your order..."
                        rows={3}
                        {...field}
                      />
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
