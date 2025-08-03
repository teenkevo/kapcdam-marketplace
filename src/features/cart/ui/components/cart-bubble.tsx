"use client";

import { useUser } from "@clerk/nextjs";
import {
  CartNavButton,
  CartNavButtonLocal,
  CartNavButtonFallBack,
} from "./cart-nav-button";
import { useCartSync } from "@/features/cart/hooks/use-cart-sync";

export function CartBubble() {
  const { isSignedIn } = useUser();
  const { isSyncing } = useCartSync();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isSyncing ? (
        <CartNavButtonFallBack />
      ) : isSignedIn ? (
        <CartNavButton />
      ) : (
        <CartNavButtonLocal />
      )}
    </div>
  );
}
