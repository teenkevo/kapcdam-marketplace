"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "@/trpc/client";
import { CartSyncProvider } from "@/features/cart/hooks/cart-sync-context";
import { usePathname } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <ClerkProvider>
      <TRPCReactProvider>
        {isAdminRoute ? children : <CartSyncProvider>{children}</CartSyncProvider>}
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
