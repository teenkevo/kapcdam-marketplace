"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AmountSelectorProps {
  amounts: number[];
  selectedAmount: number | null;
  onAmountSelect: (amount: number) => void;
  customAmount: string;
  onCustomAmountChange: (amount: string) => void;
  isCustomSelected?: boolean;
  onCustomSelect?: () => void;
}

export default function AmountSelector({
  amounts,
  selectedAmount,
  onAmountSelect,
  customAmount,
  onCustomAmountChange,
  isCustomSelected = false,
  onCustomSelect,
}: AmountSelectorProps) {
  return (
    <div className="space-y-3">
      {/* Preset Amounts */}
      <div className="grid grid-cols-3 gap-2">
        {amounts.map((amount) => (
          <Button
            key={amount}
            variant={
              selectedAmount === amount && !isCustomSelected
                ? "default"
                : "outline"
            }
            className={`text-sm font-medium ${
              selectedAmount === amount && !isCustomSelected
                ? "bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => onAmountSelect(amount)}
          >
            ${amount}/month
          </Button>
        ))}
      </div>

      {/* Custom Amount */}
      <div className="grid grid-cols-1 gap-2">
        <div className="relative">
          <Input
            type="text"
            placeholder="Other amount"
            value={customAmount}
            onChange={(e) => onCustomAmountChange(e.target.value)}
            onFocus={() => onCustomSelect?.()}
          />
        </div>
      </div>
    </div>
  );
}
