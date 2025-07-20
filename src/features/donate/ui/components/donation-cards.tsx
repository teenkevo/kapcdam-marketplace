"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Heart,
  Shield,
  Users,
  BookOpen,
  Stethoscope,
  CheckCircle,
} from "lucide-react";
import AmountSelector from "@/features/home/ui/components/amount-selector";

export default function DonationCards() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [donationType, setDonationType] = useState<"monthly" | "one-time">(
    "monthly"
  );

  const monthlyAmounts = [10, 25, 50, 100, 200, 500];
  const oneTimeAmounts = [25, 50, 100, 250, 500, 1000];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustomSelected(false);
    setCustomAmount("");
  };

  const handleCustomSelect = () => {
    setIsCustomSelected(true);
    setSelectedAmount(null);
  };

  const impactData = [
    {
      amount: 10,
      impact: "Provides school supplies for 1 child for a month",
      icon: BookOpen,
    },
    {
      amount: 25,
      impact: "Covers basic healthcare needs for 1 child for a month",
      icon: Stethoscope,
    },
    {
      amount: 50,
      impact: "Supports vocational training for 1 person for a month",
      icon: Users,
    },
    {
      amount: 100,
      impact: "Provides comprehensive support for 1 child for a month",
      icon: Heart,
    },
  ];

  return (
    <section className="relative -mt-[20vh] z-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Card - Make Your Donation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  Make Your Donation
                </CardTitle>
                <p className="text-gray-600 ">
                  Choose how you want to contribute to the cause.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Donation Type Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      donationType === "monthly"
                        ? "bg-black text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setDonationType("monthly")}
                  >
                    Monthly Giving
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      donationType === "one-time"
                        ? "bg-black text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setDonationType("one-time")}
                  >
                    One-Time Gift
                  </button>
                </div>

                {/* Amount Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Amount (USD)
                  </label>
                  <AmountSelector
                    amounts={
                      donationType === "monthly"
                        ? monthlyAmounts
                        : oneTimeAmounts
                    }
                    selectedAmount={selectedAmount}
                    onAmountSelect={handleAmountSelect}
                    customAmount={customAmount}
                    onCustomAmountChange={setCustomAmount}
                    isCustomSelected={isCustomSelected}
                    onCustomSelect={handleCustomSelect}
                    donationType={donationType}
                  />
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="First Name" />
                    <Input placeholder="Last Name" />
                  </div>
                  <Input placeholder="Email Address" type="email" />
                  <Input placeholder="Phone Number" type="tel" />
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Method</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-12 bg-transparent">
                      💳 Credit Card
                    </Button>
                    <Button variant="outline" className="h-12 bg-transparent">
                      🏦 Bank Transfer
                    </Button>
                  </div>
                </div>

                {/* Donate Button */}
                <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-3 font-semibold">
                  {donationType === "monthly"
                    ? "Start Monthly Giving"
                    : "Donate Now"}
                  {(selectedAmount || customAmount) && (
                    <span className="ml-2">
                      - ${selectedAmount || customAmount}
                      {donationType === "monthly" ? "/month" : ""}
                    </span>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Your donation is secure and encrypted. You will receive a
                  tax-deductible receipt via email.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Card - Your Impact */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Your Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {impactData.map((item) => (
                    <div
                      key={item.amount}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        selectedAmount === item.amount
                          ? "border-yellow-400 bg-yellow-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            ${item.amount}
                            {donationType === "monthly" ? "/month" : ""}
                          </p>
                          <p className="text-sm text-gray-600">{item.impact}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Why Give Monthly */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3">Why Give Monthly?</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Provides consistent support for ongoing programs
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Helps us plan and budget for long-term impact
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Lower processing fees mean more goes to children
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Transparency */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    100%
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    of your donation goes directly to supporting disabled
                    children
                  </div>
                  <Button variant="outline" size="sm">
                    View Financial Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
