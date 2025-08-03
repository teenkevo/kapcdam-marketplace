"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { useCartSyncContext } from "@/features/cart/hooks/cart-sync-context";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";

export function CartNavButton() {
  const { setIsCartOpen } = useLocalCartStore();
  const { isSignedIn } = useUser();
  const trpc = useTRPC();

  // Get cart data using the same query as cart-sheet
  const { data: userCart } = useQuery({
    ...trpc.cart.getUserCart.queryOptions(),
    enabled: isSignedIn,
  });

  const totalItems = useMemo(() => {
    return userCart?.itemCount ?? 0;
  }, [userCart?.itemCount]);

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

export function CartNavButtonLocal() {
  const { itemCount, setIsCartOpen } = useLocalCartStore();
  const totalItems = itemCount();

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

export const CartNavButtonFallBack = () => (
  <Button
    type="button"
    disabled
    className="relative rounded-full bg-gradient-to-b from-[#39393F] to-[#222227] text-white shadow disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <ShoppingCart strokeWidth={2} className="text-white h-6 w-6" />
    Cart
    <Badge
      variant="secondary"
      className="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-b from-[#39393F] to-[#222227] text-lime-300 rounded-full p-0 flex items-center justify-center text-xs font-bold"
    >
      <Loader2 className="h-3 w-3 animate-spin" />
    </Badge>
  </Button>
);

// Wrapper component that handles syncing state for navigation
export function CartNavButtonWrapper() {
  const { isSyncing } = useCartSyncContext();

  if (isSyncing) {
    return <CartNavButtonFallBack />;
  }

  return <CartNavButton />;
}

// Wrapper component that handles syncing state for local navigation
export function CartNavButtonLocalWrapper() {
  const { isSyncing } = useCartSyncContext();

  if (isSyncing) {
    return <CartNavButtonFallBack />;
  }

  return <CartNavButtonLocal />;
}
