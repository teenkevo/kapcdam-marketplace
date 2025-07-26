"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { trpc } from "@/trpc/client";

export function CartNavButton() {
  const { isLoaded, isSignedIn } = useUser();
  const { itemCount, setIsCartOpen } = useLocalCartStore();
  const [totalItems, setTotalItems] = useState(0);
  const localItemCount = itemCount();

  const [userCart] = trpc.cart.getUserCart.useSuspenseQuery();

    console.log("userCart data:", userCart);

  useEffect(() => {
    if (!isSignedIn) {
      setTotalItems(localItemCount);
    } else {
      setTotalItems(userCart.data?.itemCount || 0);
    }
  }, [isSignedIn, localItemCount, userCart.data]);

  console.log("totalItems", totalItems);

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
