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

export default function CheckoutView() {
  const trpc = useTRPC();
  const { data: userCart } = useQuery(trpc.cart.getUserCart.queryOptions());

  const {
    formState,
    handleFormValidChange,
    handleFormDataChange,
    handleShippingAddressChange,
  } = useCheckoutForm();

  if (!userCart) return null;

  const handlePlaceOrder = () => {
    if (formState.isValid && formState.formData) {
      // TODO: Implement order placement logic
      console.log("Placing order with:", {
        cart: userCart,
        checkoutData: formState.formData,
        shippingCost: formState.shippingCost,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 py-20">
      {/* Left Column - Checkout Form */}
      <div className="">
        <CheckoutForm
          onFormValidChange={handleFormValidChange}
          onFormDataChange={handleFormDataChange}
          onShippingAddressChange={handleShippingAddressChange}
        />
      </div>

      {/* Right Column - Order Summary */}
      <div>
        <OrderSummary
          userCart={userCart}
          shippingCost={formState.shippingCost}
          onPrimaryAction={handlePlaceOrder}
          primaryActionText="Place Order"
          primaryActionDisabled={!formState.isValid}
        />
      </div>
    </div>
  );
}
