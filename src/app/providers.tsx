"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "@/trpc/client";
import { useCartSync } from "@/features/cart/hooks/use-cart-sync";

function CartSync() {
  const {} = useCartSync();

  useEffect(() => {}, []);

  return null;
}

import dynamic from "next/dynamic";
import { useEffect } from "react";
const ClientOnlyCartSync = dynamic(() => Promise.resolve(CartSync), {
  ssr: false,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <TRPCReactProvider>
        <CartSync />
        {children}
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
