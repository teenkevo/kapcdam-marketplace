"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/features/cart/lib/contexts/cart-context";
import { ShoppingCart } from "lucide-react";

export function CartNavButton() {
  const { getTotalItems, setIsCartOpen, isCartOpen } = useCart();
  const totalItems = getTotalItems();

  console.log(isCartOpen);

  return (
    <Button
      type="button"
      onClick={() => setIsCartOpen(true)}
      className="relative rounded-full bg-gradient-to-b from-[#39393F] to-[#222227] text-white shadow"
    >
      <ShoppingCart strokeWidth={2} className="text-white h-6 w-6" />
      Cart
      <Badge
        variant="secondary"
        className="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-b from-[#39393F] to-[#222227] text-lime-300 rounded-full p-0 flex items-center justify-center text-xs font-bold"
      >
        {totalItems > 99 ? "99+" : totalItems}
      </Badge>
    </Button>
  );
}
