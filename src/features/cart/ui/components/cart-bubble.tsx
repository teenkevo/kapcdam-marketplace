"use client";

import { useUser } from "@clerk/nextjs";
import {
  CartNavButton,
  CartNavButtonLocal,
  CartNavButtonFallBack,
} from "./cart-nav-button";
import { useCartSyncContext } from "@/features/cart/hooks/cart-sync-context";

export function CartBubble() {
  const { isSignedIn } = useUser();
  const { isSyncing } = useCartSyncContext();

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
