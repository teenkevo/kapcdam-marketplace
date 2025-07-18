"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AmountSelector from "./amount-selector";

export default function DonationForm() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustomSelected, setIsCustomSelected] = useState(false);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustomSelected(false);
    setCustomAmount("");
  };

  const handleCustomSelect = () => {
    setIsCustomSelected(true);
    setSelectedAmount(null);
  };

  const handleCustomAmountChange = (amount: string) => {
    setCustomAmount(amount);
    if (amount && !isCustomSelected) {
      handleCustomSelect();
    }
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-xl">
      <CardContent className="p-6">
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger
              value="once"
              className="text-sm font-medium data-[state=active]:bg-yellow-400"
            >
              GIVE ONCE
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="text-sm font-medium data-[state=active]:bg-yellow-400"
            >
              MONTHLY
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Choose an amount to give per month
              </h3>
              <AmountSelector
                amounts={[10, 20, 40, 100]}
                selectedAmount={selectedAmount}
                onAmountSelect={handleAmountSelect}
                customAmount={customAmount}
                onCustomAmountChange={handleCustomAmountChange}
                isCustomSelected={isCustomSelected}
                onCustomSelect={handleCustomSelect}
              />
              <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3">
                JOIN TODAY
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="once">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Choose an amount to give
              </h3>
              <AmountSelector
                amounts={[25, 50, 100, 250]}
                selectedAmount={selectedAmount}
                onAmountSelect={handleAmountSelect}
                customAmount={customAmount}
                onCustomAmountChange={handleCustomAmountChange}
                isCustomSelected={isCustomSelected}
                onCustomSelect={handleCustomSelect}
              />
              <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3">
                DONATE NOW
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        <div className="text-center space-y-2 border-t border-dashed border-gray-200 pt-4 mt-5">
          <p className="text-xs text-gray-500">
            🔒 Your donation is secure and will be used to support our mission.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
