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
        onClick={() => setIsCartOpen(true)}
        className="relative h-14 w-14 rounded-full bg-[#C5F82A] text-black hover:bg-[#B4E729] shadow-lg hover:shadow-xl transition-all duration-1000 animate-bounce"
      >
        <ShoppingCart className="h-6 w-6" />
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
        >
          {totalItems > 99 ? "99+" : totalItems}
        </Badge>
      </Button>
    </div>
  );
}
