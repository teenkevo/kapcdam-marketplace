"use client";

import { useEffect, useRef, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

export function useCartSync() {
  const { userId, isLoaded } = useAuth();
  const { items, hasItems, clearCart } = useLocalCartStore();
  const hasAttemptedSync = useRef(false);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Sync mutation
  const syncCartMutation = useMutation(
    trpc.cart.syncCartToUser.mutationOptions({
      onSuccess: (result) => {
        if (result.success) {
          // Clear local cart after successful sync
          clearCart();

          startTransition(() => {
            // Force refetch for consistency with other cart operations
            queryClient.refetchQueries(trpc.cart.getUserCart.queryOptions());

            queryClient.refetchQueries({
              queryKey: ["cart", "getDisplayData"],
            });
          });

          // Show concise success message
          if ("itemsAdded" in result && result.itemsAdded > 0) {
            toast.success("Cart synced!");
          }

          if (pathname === "/checkout") {
            // Already on checkout, just refresh to get the synced cart
            router.refresh();
          }
        }
      },
      onError: (error) => {
        hasAttemptedSync.current = false;
        const errorMessage = getCartErrorMessage(error);
        toast.error(`Failed to sync cart: ${errorMessage}`);
      },
    })
  );

  // Auto-sync effect
  useEffect(() => {
    const hasLocalItems = hasItems();
    const itemsLength = items.length;

    if (
      isLoaded &&
      userId &&
      hasLocalItems &&
      itemsLength > 0 &&
      !hasAttemptedSync.current &&
      !syncCartMutation.isPending
    ) {
      hasAttemptedSync.current = true;

      syncCartMutation.mutate({
        localCartItems: items,
      });
    }

    // Reset sync attempt when user logs out
    if (isLoaded && !userId) {
      hasAttemptedSync.current = false;
    }
  }, [
    isLoaded,
    userId,
    items.length, // Use length instead of items array or hasItems() function
    syncCartMutation.isPending,
  ]);

  return {
    isSyncing:
      isLoaded && userId && hasItems()
        ? syncCartMutation.isPending || isPending
        : false, // Don't show syncing if no local items or not signed in
    isError: syncCartMutation.isError,
    error: syncCartMutation.error,
    canSync: Boolean(
      isLoaded && userId && hasItems() && !syncCartMutation.isPending
    ),
  };
}

// Helper function for error messages
function getCartErrorMessage(error: any): string {
  if (!error?.data?.code) return "Something went wrong";

  switch (error.data.code) {
    case "BAD_REQUEST":
      if (error.message.includes("Insufficient stock")) {
        return "Some items are out of stock";
      }
      if (error.message.includes("Variant SKU is required")) {
        return "Product variant information is missing";
      }
      if (error.message.includes("not found")) {
        return "Some items are no longer available";
      }
      return error.message;
    case "NOT_FOUND":
      if (error.message.includes("User not found")) {
        return "Account setup required";
      }
      if (error.message.includes("Product not found")) {
        return "Some products are no longer available";
      }
      if (error.message.includes("Course not found")) {
        return "Some courses are no longer available";
      }
      return "Some items are no longer available";
    case "UNAUTHORIZED":
      return "Please sign in to sync your cart";
    case "INTERNAL_SERVER_ERROR":
    default:
      return "Unable to sync cart. Please try again.";
  }
}
