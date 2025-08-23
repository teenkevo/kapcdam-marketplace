"use client";

import { useEffect, useRef, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

/**
 * Custom hook to synchronize the local cart with the user's cart on the server.
 * This hook automatically syncs the cart when a logged-in, non-admin user
 * has items in their local (unauthenticated) cart.
 */
export function useCartSync() {
  const { userId, isLoaded } = useAuth();
  const { items, hasItems, clearCart } = useLocalCartStore();
  const hasAttemptedSync = useRef(false);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: adminProfile, isLoading: isLoadingAdmin } = useQuery({
    ...trpc.team.getAdminProfile.queryOptions(),
    // Only check admin when authenticated. This avoids unnecessary calls.
    enabled: !!userId,
    retry: false,
  });

  // A user is considered an admin if the profile query succeeds.
  const isAdmin = !!adminProfile && !isLoadingAdmin;

  const syncCartMutation = useMutation(
    trpc.cart.syncCartToUser.mutationOptions({
      onSuccess: (result) => {
        if (result.success) {
          clearCart();

          startTransition(() => {
            queryClient.refetchQueries(trpc.cart.getUserCart.queryOptions());
            queryClient.refetchQueries({
              queryKey: ["cart", "getDisplayData"],
            });
          });

          if ("itemsAdded" in result && result.itemsAdded > 0) {
            toast.success("Cart synced to your account!");
          }

          if (pathname === "/checkout") {
            router.refresh();
          }
        }
      },
      onError: (error) => {
        // If sync fails, allow it to be re-attempted.
        hasAttemptedSync.current = false;
        const errorMessage = getCartErrorMessage(error);

        toast.error(`Failed to sync cart: ${errorMessage}`);
      },
    })
  );

  // Effect to trigger the cart synchronization automatically.
  useEffect(() => {
    // Skip entirely on admin routes to avoid any leakage
    if (pathname?.startsWith("/admin")) {
      hasAttemptedSync.current = false;
      return;
    }

    // Wait until auth is loaded
    if (!isLoaded) {
      return;
    }

    // Reset sync attempt flag if the user logs out.
    if (!userId) {
      hasAttemptedSync.current = false;
      return;
    }

    // Do not attempt anything until the admin check has finished
    if (isLoadingAdmin) {
      return;
    }

    // --- EARLY EXIT FOR ADMINS ---
    if (isAdmin) {
      hasAttemptedSync.current = false;
      return;
    }

    const shouldSync =
      hasItems() &&
      !hasAttemptedSync.current &&
      !syncCartMutation.isPending;

    if (shouldSync) {
      hasAttemptedSync.current = true;
      syncCartMutation.mutate({
        localCartItems: items,
      });
    }
  }, [
    pathname,
    isLoaded,
    userId,
    isLoadingAdmin,
    isAdmin,
    items,
    hasItems,
    syncCartMutation,
  ]);

  // --- ADMIN-AWARE RETURN VALUES ---

  if (isAdmin) {
    return {
      isSyncing: false,
      isError: false,
      error: null,
      canSync: false,
    };
  }

  // Return values for regular, non-admin users.
  return {
    isSyncing: hasItems() && (syncCartMutation.isPending || isPending),
    isError: syncCartMutation.isError,
    error: syncCartMutation.error,
    canSync:
      !!(isLoaded && userId && hasItems()) && !syncCartMutation.isPending,
  };
}

/**
 * Helper function to generate user-friendly error messages from API errors.
 * @param error The error object from the tRPC mutation.
 * @returns A human-readable error string.
 */
function getCartErrorMessage(error: any): string {
  if (!error?.data?.code) return "An unexpected error occurred.";

  switch (error.data.code) {
    case "BAD_REQUEST":
      if (error.message.includes("Insufficient stock")) {
        return "Some items in your cart are out of stock.";
      }
      if (error.message.includes("Variant SKU is required")) {
        return "Product variant information is missing.";
      }
      if (error.message.includes("not found")) {
        return "Some items are no longer available.";
      }
      return error.message;
    case "NOT_FOUND":
      if (error.message.includes("User not found")) {
        return "Your account setup is incomplete.";
      }
      return "Some items in your cart are no longer available.";
    case "UNAUTHORIZED":
      return "Please sign in to sync your cart.";
    case "INTERNAL_SERVER_ERROR":
    default:
      return "Unable to sync cart at this time. Please try again later.";
  }
}
