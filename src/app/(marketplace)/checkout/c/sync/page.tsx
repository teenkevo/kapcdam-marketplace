"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import CheckoutView from "@/features/checkout/ui/views/checkout-view";

export default function CheckoutSyncPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { hasItems } = useLocalCartStore();

  useEffect(() => {
    // If auth is loaded and user is not signed in, redirect to sign-in
    if (isLoaded && !isSignedIn) {
      const redirectUrl = encodeURIComponent("/checkout/c/sync");
      router.replace(`/sign-in?redirectUrl=${redirectUrl}`);
      return;
    }

    // If signed in but no local items to sync, redirect to home
    if (isLoaded && isSignedIn && !hasItems()) {
      router.replace("/");
      return;
    }
  }, [isLoaded, isSignedIn, hasItems, router]);

  // Don't render checkout until auth is loaded and user is signed in
  if (!isLoaded || !isSignedIn) {
    return null; // Will redirect via useEffect
  }

  return <CheckoutView cartId="sync" />;
}