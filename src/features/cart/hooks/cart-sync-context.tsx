"use client";

import { createContext, useContext, ReactNode } from "react";
import { useCartSync } from "./use-cart-sync";

interface CartSyncContextType {
  isSyncing: boolean;
  isError: boolean;
  error: any;
  canSync: boolean;
}

const CartSyncContext = createContext<CartSyncContextType | undefined>(undefined);

export function CartSyncProvider({ children }: { children: ReactNode }) {
  const syncState = useCartSync();
  
  return (
    <CartSyncContext.Provider value={syncState}>
      {children}
    </CartSyncContext.Provider>
  );
}

export function useCartSyncContext() {
  const context = useContext(CartSyncContext);
  if (context === undefined) {
    throw new Error("useCartSyncContext must be used within a CartSyncProvider");
  }
  return context;
}