"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useCartSync } from "@/features/cart/hooks/use-cart-sync";
import { Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const trpc = useTRPC();
  const { isSyncing } = useCartSync();

  // Get the user's cart after sign-in and sync
  const { data: userCart, isLoading: isCartLoading } = useQuery({
    ...trpc.cart.getUserCart.queryOptions(),
    enabled: isSignedIn && isLoaded,
  });

  useEffect(() => {
    // If not signed in, redirect to sign-in page
    if (isLoaded && !isSignedIn) {
      router.replace(`/sign-in?redirectUrl=${encodeURIComponent('/checkout')}`);
      return;
    }

    // If signed in, cart sync is complete, and we have a cart, redirect to the cart-specific checkout
    if (isSignedIn && !isSyncing && !isCartLoading && userCart?._id) {
      router.replace(`/checkout/c/${userCart._id}`);
      return;
    }

    // If signed in, cart sync is complete, but no cart exists (empty cart), redirect to home
    if (isSignedIn && !isSyncing && !isCartLoading && !userCart) {
      router.replace('/');
      return;
    }
  }, [isSignedIn, isLoaded, isSyncing, isCartLoading, userCart, router]);

  // Show loading state while auth is loading, syncing, or waiting for cart data
  if (!isLoaded || isSyncing || isCartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#C5F82A]" />
          <h3 className="text-lg font-medium mb-1">
            {!isLoaded 
              ? "Loading..." 
              : isSyncing 
              ? "Syncing your cart..." 
              : "Preparing checkout..."
            }
          </h3>
          <p className="text-gray-600">This will only take a moment</p>
        </div>
      </div>
    );
  }

  // Fallback (shouldn't reach here due to useEffect redirects)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#C5F82A]" />
        <h3 className="text-lg font-medium mb-1">Preparing checkout...</h3>
        <p className="text-gray-600">This will only take a moment</p>
      </div>
    </div>
  );
}