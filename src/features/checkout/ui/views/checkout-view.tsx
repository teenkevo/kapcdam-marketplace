"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Home,
  ShoppingCart,
  Plus,
  MapPin,
  Phone,
  CreditCard,
  Truck,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { OrderSummary } from "../components/order-summary";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import CheckoutForm from "../components/CheckoutForm";
import { useCheckoutForm } from "../../hooks/use-checkout-form";
import {
  CheckoutFormSkeleton,
  OrderSummarySkeleton,
} from "../components/checkout-skeleton";

interface CheckoutViewProps {
  cartId: string;
}

export default function CheckoutView({ cartId }: CheckoutViewProps) {
  const trpc = useTRPC();
  const { data: userCart, isLoading: isCartLoading } = useQuery(
    trpc.cart.getCartById.queryOptions({ cartId })
  );

  const {
    formState,
    handleFormValidChange,
    handleFormDataChange,
    handleShippingAddressChange,
  } = useCheckoutForm();

  const handlePlaceOrder = () => {
    if (formState.isValid && formState.formData && userCart) {
      console.log("Placing order with:", {
        cart: userCart,
        checkoutData: formState.formData,
        shippingCost: formState.shippingCost,
      });
    }
  };

  if (isCartLoading || !userCart) {
    return (
      <div className="max-w-7xl mx-auto py-20">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center">Secure Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Checkout Form Skeleton */}
          <div>
            <CheckoutFormSkeleton />
          </div>

          {/* Right Column - Order Summary Skeleton */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <OrderSummarySkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-20">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center">Secure Checkout</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Checkout Form */}
        <div>
          <CheckoutForm
            onFormValidChange={handleFormValidChange}
            onFormDataChange={handleFormDataChange}
            onShippingAddressChange={handleShippingAddressChange}
          />
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <OrderSummary
            userCart={userCart}
            shippingCost={formState.shippingCost}
            onPrimaryAction={handlePlaceOrder}
            primaryActionText="Place Order"
            primaryActionDisabled={!formState.isValid}
          />
        </div>
      </div>
    </div>
  );
}
