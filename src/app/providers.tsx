"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "@/trpc/client";
import { CartSyncProvider } from "@/features/cart/hooks/cart-sync-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <TRPCReactProvider>
        <CartSyncProvider>{children} </CartSyncProvider>
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
