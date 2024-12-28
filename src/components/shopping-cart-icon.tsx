"use client";

import { ShoppingCart } from "lucide-react";

interface ShoppingCartIconProps {
  itemCount: number;
}

export default function ShoppingCartIcon({ itemCount }: ShoppingCartIconProps) {
  return (
    <div className="flex items-center space-x-2 text-white">
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#A2E634] text-black font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </div>
      <span className="text-sm">Cart</span>
    </div>
  );
}
