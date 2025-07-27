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

interface CartItem {
  id: string;
  title: string;
  variant: string;
  quantity: number;
  price: number;
  image: string;
}

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  landmark: string;
  city: string;
  isDefault: boolean;
}

interface CheckoutFormData {
  selectedAddress: string;
  deliveryMethod: string;
  paymentMethod: string;
  orderNotes: string;
}

// Sample data
const cartItems: CartItem[] = [
  {
    id: "1",
    title: "Topicals Slick Salve Mint Lip Balm",
    variant: "15ml - Mint",
    quantity: 1,
    price: 85000,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "2",
    title: "Organic Face Moisturizer",
    variant: "50ml - Sensitive Skin",
    quantity: 2,
    price: 120000,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "3",
    title: "Natural Body Scrub",
    variant: "200g - Coconut",
    quantity: 1,
    price: 65000,
    image: "/placeholder.svg?height=80&width=80",
  },
];

const existingAddresses: Address[] = [
  {
    id: "1",
    label: "Home",
    fullName: "John Doe",
    phone: "+256 700 123 456",
    address: "Plot 123, Kampala Road, Nakasero",
    landmark: "Near Sheraton Hotel",
    city: "Kampala",
    isDefault: true,
  },
  {
    id: "2",
    label: "Work",
    fullName: "John Doe",
    phone: "+256 700 123 456",
    address: "Office Complex, Buganda Road",
    landmark: "Opposite Bank of Uganda",
    city: "Kampala",
    isDefault: false,
  },
];

export default function CheckoutPage() {
  const [formData, setFormData] = useState<CheckoutFormData>({
    selectedAddress: "1",
    deliveryMethod: "delivery",
    paymentMethod: "mobile_money",
    orderNotes: "",
  });

  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCost = formData.deliveryMethod === "pickup" ? 0 : 6000;
  const tax = 0;
  const total = subtotal + shippingCost + tax;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
     
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <Home className="h-5 w-5" />
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <Link href="/cart" className="text-gray-600 hover:text-gray-900">
                Cart
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 font-medium">Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-[#C5F82A] text-black rounded-full text-sm font-medium">
                <Check className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">
                Cart
              </span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-[#C5F82A] text-black rounded-full text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">
                Checkout
              </span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-600 rounded-full text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm text-gray-500">Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Cart Summary - Left Column */}
          <div className="lg:col-span-5 mb-8 lg:mb-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Order Summary</CardTitle>
                <Link
                  href="/cart"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Edit Cart
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 py-4 border-b last:border-b-0"
                  >
                    <div className="relative">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover"
                      />
                      <Badge
                        variant="secondary"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {item.quantity}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-500">{item.variant}</p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">
                      {formatPrice(shippingCost)}
                    </span>
                  </div>
                  {tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900">{formatPrice(tax)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-[#C5F82A] bg-black px-2 py-1 rounded">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form - Right Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Shipping Address Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={formData.selectedAddress}
                  onValueChange={(value) =>
                    setFormData({ ...formData, selectedAddress: value })
                  }
                >
                  {existingAddresses.map((address) => (
                    <div
                      key={address.id}
                      className="flex items-start space-x-3"
                    >
                      <RadioGroupItem
                        value={address.id}
                        id={address.id}
                        className="mt-1"
                      />
                      <Label
                        htmlFor={address.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="border rounded-lg p-4 hover:border-gray-400 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              {address.label}
                            </span>
                            {address.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-medium text-gray-900">
                              {address.fullName}
                            </p>
                            <p>{address.address}</p>
                            <p>Near {address.landmark}</p>
                            <p className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {address.phone}
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <Collapsible
                  open={showNewAddressForm}
                  onOpenChange={setShowNewAddressForm}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Address
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="addressLabel">Address Label</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select label" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="home">Home</SelectItem>
                            <SelectItem value="work">Work</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" placeholder="Enter full name" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" placeholder="+256 700 000 000" />
                    </div>
                    <div>
                      <Label htmlFor="address">Complete Address</Label>
                      <Textarea
                        id="address"
                        placeholder="Enter complete address"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="landmark">Nearest Landmark</Label>
                        <Input
                          id="landmark"
                          placeholder="e.g., Near Sheraton Hotel"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City/Area</Label>
                        <Input id="city" placeholder="e.g., Kampala" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="setDefault" />
                      <Label htmlFor="setDefault" className="text-sm">
                        Set as default address
                      </Label>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-[#C5F82A] text-black hover:bg-[#B5E825]"
                      >
                        Save Address
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowNewAddressForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            {/* Delivery Method Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Delivery Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.deliveryMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, deliveryMethod: value })
                  }
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                      <div className="border rounded-lg p-4 hover:border-gray-400 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Local Delivery</h4>
                            <p className="text-sm text-gray-600">
                              Delivered to your address within 2-3 business days
                            </p>
                          </div>
                          <span className="font-medium">
                            {formatPrice(6000)}
                          </span>
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                      <div className="border rounded-lg p-4 hover:border-gray-400 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Pickup</h4>
                            <p className="text-sm text-gray-600">
                              Collect from our store location
                            </p>
                          </div>
                          <span className="font-medium text-green-600">
                            Free
                          </span>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Method Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentMethod: value })
                  }
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="mobile_money" id="mobile_money" />
                    <Label
                      htmlFor="mobile_money"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="border rounded-lg p-4 hover:border-gray-400 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Mobile Money</h4>
                            <p className="text-sm text-gray-600">
                              Pay with MTN Mobile Money or Airtel Money
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <div className="w-8 h-5 bg-yellow-400 rounded text-xs flex items-center justify-center font-bold">
                              MTN
                            </div>
                            <div className="w-8 h-5 bg-red-600 rounded text-xs flex items-center justify-center text-white font-bold">
                              A
                            </div>
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label
                      htmlFor="bank_transfer"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="border rounded-lg p-4 hover:border-gray-400 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Bank Transfer</h4>
                            <p className="text-sm text-gray-600">
                              Direct bank transfer to our account
                            </p>
                          </div>
                          <div className="w-8 h-5 bg-blue-600 rounded text-xs flex items-center justify-center text-white font-bold">
                            🏦
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value="cash_on_delivery"
                      id="cash_on_delivery"
                    />
                    <Label
                      htmlFor="cash_on_delivery"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="border rounded-lg p-4 hover:border-gray-400 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Cash on Delivery</h4>
                            <p className="text-sm text-gray-600">
                              Pay when you receive your order
                            </p>
                          </div>
                          <div className="w-8 h-5 bg-green-600 rounded text-xs flex items-center justify-center text-white font-bold">
                            💵
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Order Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Special instructions (optional)"
                  value={formData.orderNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, orderNotes: e.target.value })
                  }
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none bg-transparent"
                asChild
              >
                <Link href="/cart">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Cart
                </Link>
              </Button>
              <Button
                className="flex-1 bg-[#C5F82A] text-black hover:bg-[#B5E825] font-medium"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed to Payment
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
