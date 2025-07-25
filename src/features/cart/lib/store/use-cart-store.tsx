import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { trpc } from "@/trpc/client";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export interface CartItem {
  type: "product" | "course";
  quantity: number;
  currentPrice: number;
  itemRef: string;
  addedAt: Date;
  preferredStartDate?: Date;
}

// State and actions for the store
interface CartState {
  items: CartItem[];
  isLoading: boolean;
  isCartOpen: boolean;
  isInitialized: boolean;
}

interface CartActions {
  _setIsInitialized: (initialized: boolean) => void;
  addToCart: (item: CartItem, userId?: string) => Promise<void>;
  removeFromCart: (itemId: string, userId?: string) => Promise<void>;
  updateQuantity: (
    itemId: string,
    quantity: number,
    userId?: string
  ) => Promise<void>;
  clearCart: (userId?: string) => Promise<void>;

  toggleCart: () => void;
  loadUserCart: (userId: string) => Promise<void>;
  syncGuestCartToDB: (userId: string) => Promise<void>;
}

// Create the store
export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isCartOpen: false,
      isInitialized: false,

      _setIsInitialized: (initialized) => set({ isInitialized: initialized }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      loadUserCart: async (userId) => {
        set({ isLoading: true });
        try {
          const userCart = trpc.cart.getUserCart.useQuery({ userId });
          const cartItems =
            userCart?.cartItems?.map((item: any) => ({
              id: item.product?._id || item.course?._id,
              product: item.product || item.course,
              quantity: item.quantity,
            })) || [];
          set({ items: cartItems });
        } catch (error) {
          console.error("Failed to load user cart:", error);
          set({ items: [] }); // Clear cart on error
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Adds an item to the cart.
       * Handles both guests (localStorage) and signed-in users (database).
       */
      addToCart: async (product, userId) => {
        if (userId) {
          // --- Signed-in user logic ---
          set({ isLoading: true });
          try {
            await trpc.cart.addToCart.mutate({
              userId,
              item: {
                /* ... your item data ... */
              },
            });
            await get().loadUserCart(userId); // Refresh cart from DB
          } catch (error) {
            console.error("Failed to add item to DB cart:", error);
          } finally {
            set({ isLoading: false });
          }
        } else {
          // --- Guest user logic (managed by persist middleware) ---
          const { items } = get();
          const existingItem = items.find((item) => item.id === product._id);
          if (existingItem) {
            set({
              items: items.map((item) =>
                item.id === product._id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            });
          } else {
            set({
              items: [...items, { id: product._id, product, quantity: 1 }],
            });
          }
        }
      },

      /**
       * Removes an item from the cart.
       */
      removeFromCart: async (productId, userId) => {
        if (userId) {
          // --- Signed-in user logic ---
          set({ isLoading: true });
          // NOTE: Your backend logic for removing an item might differ.
          // This example assumes updating quantity to 0 removes it.
          // You might need to find the cartItem._key first.
          try {
            // This part requires you to know the cart ID and the item's key in Sanity
            // This is a simplified placeholder.
            console.warn(
              "DB remove logic needs cartId and itemId, which are not available here directly. Refetching is key."
            );
            // A better approach might be a dedicated `removeItemFromCart` mutation.
            // For now, we'll just refetch.
            await get().loadUserCart(userId);
          } catch (error) {
            console.error("Failed to remove item from DB cart:", error);
          } finally {
            set({ isLoading: false });
          }
        } else {
          // --- Guest user logic ---
          set({ items: get().items.filter((item) => item.id !== productId) });
        }
      },

      /**
       * Updates an item's quantity.
       */
      updateQuantity: async (productId, quantity, userId) => {
        if (quantity <= 0) {
          get().removeFromCart(productId, userId);
          return;
        }
        // Implement logic similar to addToCart/removeFromCart for signed-in vs guest
        console.log("updateQuantity not fully implemented for DB yet");
      },

      /**
       * Clears the entire cart.
       */
      clearCart: async (userId) => {
        if (userId) {
          // --- Signed-in user logic ---
          set({ isLoading: true });
          try {
            // This also requires the cartId.
            // A `clearUserCart` mutation would be ideal.
            await get().loadUserCart(userId); // For now, just refetch
          } finally {
            set({ isLoading: false });
          }
        } else {
          // --- Guest user logic ---
          set({ items: [] });
        }
      },

      /**
       * Syncs the guest cart to the database after they sign in.
       */
      syncGuestCartToDB: async (userId) => {
        set({ isLoading: true });
        const localCartItems = get().items;

        if (localCartItems.length === 0) {
          set({ isLoading: false });
          return;
        }

        try {
          // Assuming you have a tRPC mutation for this
          await trpc.cart.syncCartToUser.mutate({
            userId,
            localCartItems: localCartItems.map((item) => ({
              type: "product",
              quantity: item.quantity,
              currentPrice: parseInt(item.product.price || "0"),
              product: item.product._id,
            })),
          });
          // After successful sync, clear local items and load fresh from DB
          set({ items: [] });
          await get().loadUserCart(userId);
        } catch (error) {
          console.error("Failed to sync guest cart to DB:", error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      // PERSISTENCE CONFIGURATION
      name: "shopping-cart-storage", // Key in localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), // Only persist the items array
      // This function runs when the store is rehydrated from localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._setIsInitialized(true);
        }
      },
    }
  )
);

/**
 * A simple hook to manage cart initialization and synchronization on user login.
 * Place this hook in your main layout component (`app/layout.tsx`).
 */
export function useCartSyncManager() {
  const { user, isSignedIn, isLoaded: isAuthLoaded } = useUser(); // from @clerk/nextjs
  const { isInitialized, syncGuestCartToDB, loadUserCart, items } =
    useCartStore();

  useEffect(() => {
    // Wait until both Clerk auth and the Zustand store are initialized
    if (!isAuthLoaded || !isInitialized) {
      return;
    }

    const localCartHasItems = items.length > 0;

    if (isSignedIn) {
      // If the user is signed in and had items as a guest, sync them.
      if (localCartHasItems) {
        syncGuestCartToDB(user.id);
      } else {
        // Otherwise, just load their cart from the database.
        loadUserCart(user.id);
      }
    }
    // If the user is a guest, the `persist` middleware handles everything automatically.
  }, [isAuthLoaded, isInitialized, isSignedIn, user]);
}
