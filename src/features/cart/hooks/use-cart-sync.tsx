"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCartSync() {
  const { userId, isLoaded } = useAuth();
  const { items, hasItems, clearCart } = useLocalCartStore();
  const hasAttemptedSync = useRef(false);
  const [isPending, startTransition] = useTransition();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Sync mutation
  const syncCartMutation = useMutation(
    trpc.cart.syncCartToUser.mutationOptions({
      onSuccess: (result) => {
        startTransition(() => {
          if (result.success) {
            // Clear local cart after successful sync
            clearCart();

            // Invalidate server cart query to refetch updated data
            queryClient.invalidateQueries(trpc.cart.getUserCart.queryOptions());

            // Check if items were actually synced (itemsAdded exists)
            if ("itemsAdded" in result && result.itemsAdded > 0) {
              const itemsText = result.itemsAdded === 1 ? "item" : "items";
              toast.success(
                `${result.itemsAdded} ${itemsText} synced to your account!`
              );
            } else {
              // Handle case where no items were synced
              toast.success("Cart synced successfully!");
            }
          }
        });
      },
      onError: (error) => {
        const errorMessage = getCartErrorMessage(error);
        toast.error(`Failed to sync cart: ${errorMessage}`);
      },
    })
  );

  // Auto-sync effect
  useEffect(() => {
    if (
      isLoaded &&
      userId &&
      hasItems() &&
      !hasAttemptedSync.current &&
      !syncCartMutation.isPending
    ) {
      hasAttemptedSync.current = true;

      syncCartMutation.mutate({
        localCartItems: items,
      });
    }

    if (isLoaded && !userId) {
      hasAttemptedSync.current = false;
    }
  }, [
    isLoaded,
    userId,
    hasItems,
    syncCartMutation.isPending,
    items,
    syncCartMutation,
  ]);

  return {
    isSyncing: syncCartMutation.isPending || isPending,
    isError: syncCartMutation.isError,
    error: syncCartMutation.error,
    canSync: isLoaded && userId && hasItems() && !syncCartMutation.isPending,
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
