"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";

export function useCartSync() {
  const { userId, isLoaded } = useAuth();
  const { syncToServer, hasItems, isSyncing } = useLocalCartStore();
  const hasAttemptedSync = useRef(false);

  useEffect(() => {
    if (
      isLoaded &&
      userId &&
      hasItems() &&
      !isSyncing &&
      !hasAttemptedSync.current
    ) {
      hasAttemptedSync.current = true;
      syncToServer(userId);
    }

    if (isLoaded && !userId) {
      hasAttemptedSync.current = false;
    }
  }, [isLoaded, userId, hasItems, isSyncing, syncToServer]);

  return { isSyncing };
}
