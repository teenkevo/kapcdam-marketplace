"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/features/cart/lib/contexts/cart-context";
import { ShoppingCart } from "lucide-react";

export function CartBubble() {
  const { getTotalItems, setIsCartOpen } = useCart();
  const totalItems = getTotalItems();

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="relative rounded-full bg-gradient-to-b from-[#39393F] to-[#222227] text-white shadow"
      >
        <ShoppingCart strokeWidth={2} className="text-white h-6 w-6" />
        <Badge
          variant="secondary"
          className="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-b from-[#39393F] to-[#222227] text-lime-300 rounded-full p-0 flex items-center justify-center text-xs font-bold"
        >
          {totalItems > 99 ? "99+" : totalItems}
        </Badge>
      </Button>
    </div>
  );
}
