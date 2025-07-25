
"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProvider } from "@/trpc/client";
import { useCartSync } from "@/features/cart/hooks/use-cart-sync";

function CartSync() {
  useCartSync();
  return null; 
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <TRPCProvider>
        <CartSync />
        {children}
      </TRPCProvider>
    </ClerkProvider>
  );
}
