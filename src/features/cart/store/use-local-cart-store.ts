import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { toast } from "sonner";
import type { CartItemType } from "@/features/cart/schema";

interface LocalCartState {
  // State
  items: CartItemType[];
  isCartOpen: boolean;
  lastUpdated: Date | null;
  syncAttempts: number; // Track sync failures for retry logic

  // Actions
  addLocalCartItem: (
    item: Omit<CartItemType, "addedAt">,
    showToast?: boolean
  ) => void;
  removeItem: (
    productId?: string,
    courseId?: string,
    selectedVariantSku?: string
  ) => void;
  updateQuantity: (
    productId: string,
    courseId: string,
    selectedVariantSku: string | undefined,
    quantity: number,
    availableStock?: number
  ) => void;
  clearCart: () => void;
  setIsCartOpen: (isOpen: boolean) => void;
  isInCart: (
    productId?: string,
    courseId?: string,
    selectedVariantSku?: string
  ) => boolean;

  // New lifecycle methods
  markSyncSuccess: () => void; // Call after successful sync to server
  markSyncFailure: () => void; // Call when sync fails
  resetSyncAttempts: () => void; // Reset sync attempts counter
  shouldAttemptSync: () => boolean; // Check if we should try syncing

  // Computed
  itemCount: () => number;
  isEmpty: () => boolean;
  hasItems: () => boolean;
  needsSync: () => boolean; // Check if localStorage has items that need syncing
}

export const useLocalCartStore = create<LocalCartState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        items: [],
        isCartOpen: false,
        lastUpdated: null,
        syncAttempts: 0,

        // Actions
        addLocalCartItem: (newItem, showToast = true) => {
          set((state) => {
            const itemWithTimestamp = {
              ...newItem,
              addedAt: new Date().toISOString(), // Use ISO string for consistency
            };

            // Check if item already exists - handle variants properly
            const existingIndex = state.items.findIndex((item) => {
              if (newItem.type === "product") {
                // For products: match both productId and selectedVariantSku
                return (
                  item.type === "product" &&
                  item.productId === newItem.productId &&
                  item.selectedVariantSku === newItem.selectedVariantSku
                );
              } else {
                // For courses: match courseId only
                return (
                  item.type === "course" && item.courseId === newItem.courseId
                );
              }
            });

            let updatedItems;
            if (existingIndex !== -1) {
              // Update existing item quantity
              updatedItems = state.items.map((item, index) =>
                index === existingIndex
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item
              );
            } else {
              // Add new item
              updatedItems = [...state.items, itemWithTimestamp];
            }

            return {
              items: updatedItems,
              lastUpdated: new Date(),
            };
          });

          // Show toast for anonymous users only
          if (showToast) {
            toast.success("Added to cart!", {
              description: "Sign in to sync your cart across devices",
              classNames: {
                toast: "bg-[#e8f8e8] border-green-500",
                icon: "text-[#03a53e]",
                title: "text-[#03a53e]",
                description: "text-black",
              },
            });
          }
        },

        setIsCartOpen: (isOpen) => {
          set({ isCartOpen: isOpen });
        },

        removeItem: (productId, courseId, selectedVariantSku) => {
          set((state) => ({
            items: state.items.filter((item) => {
              if (item.type === "product") {
                // For products: match both productId and selectedVariantSku
                return !(
                  item.productId === productId &&
                  item.selectedVariantSku === selectedVariantSku
                );
              } else {
                // For courses: match courseId only
                return item.courseId !== courseId;
              }
            }),
            lastUpdated: new Date(),
          }));
        },

        updateQuantity: (
          productId,
          courseId,
          selectedVariantSku,
          quantity,
          availableStock
        ) => {
          if (quantity <= 0) {
            get().removeItem(productId, courseId, selectedVariantSku);
            return;
          }

          // Validate stock if provided
          if (
            availableStock !== undefined &&
            availableStock > 0 &&
            quantity > availableStock
          ) {
            toast.error("Insufficient stock", {
              description: `Only ${availableStock} items available`,
              classNames: {
                toast: "bg-[#ffebeb] border-[#ef4444]",
                icon: "text-[#ef4444]",
                title: "text-[#ef4444]",
                description: "text-black",
              },
            });
            return;
          }

          set((state) => ({
            items: state.items.map((item) => {
              if (item.type === "product") {
                if (
                  item.productId === productId &&
                  item.selectedVariantSku === selectedVariantSku
                ) {
                  return { ...item, quantity };
                }
              } else {
                if (item.courseId === courseId) {
                  return { ...item, quantity };
                }
              }
              return item;
            }),
            lastUpdated: new Date(),
          }));
        },

        clearCart: () => {
          set({
            items: [],
            lastUpdated: new Date(),
            syncAttempts: 0,
          });
        },

        // New lifecycle methods
        markSyncSuccess: () => {
          set({
            items: [], // Clear local cart after successful sync
            syncAttempts: 0,
            lastUpdated: new Date(),
          });
        },

        markSyncFailure: () => {
          set((state) => ({
            syncAttempts: state.syncAttempts + 1,
          }));
        },

        resetSyncAttempts: () => {
          set({ syncAttempts: 0 });
        },

        shouldAttemptSync: () => {
          const state = get();
          // Don't sync if no items or too many failed attempts
          return state.items.length > 0 && state.syncAttempts < 3;
        },

        // Computed
        itemCount: () => {
          return get().items.reduce((total, item) => total + item.quantity, 0);
        },

        isEmpty: () => {
          return get().items.length === 0;
        },

        hasItems: () => {
          return get().items.length > 0;
        },

        needsSync: () => {
          return get().items.length > 0;
        },

        isInCart: (productId, courseId, selectedVariantSku) => {
          return get().items.some((item) => {
            // Check for product with variant
            if (productId && selectedVariantSku) {
              return (
                item.type === "product" &&
                item.productId === productId &&
                item.selectedVariantSku === selectedVariantSku
              );
            }
            // Check for product without variant (hasVariants: false)
            else if (productId && !selectedVariantSku) {
              return (
                item.type === "product" &&
                item.productId === productId &&
                !item.selectedVariantSku
              );
            } else if (courseId) {
              return item.type === "course" && item.courseId === courseId;
            }

            return false;
          });
        },
      }),
      {
        name: "kapcdam-cart-storage",
        partialize: (state) => ({
          items: state.items,
          lastUpdated: state.lastUpdated,
          syncAttempts: state.syncAttempts, // Persist sync attempts for retry logic
        }),
      }
    )
  )
);

// Hook for handling cart sync after login
export const useCartSync = () => {
  const store = useLocalCartStore();

  return {
    // Check if sync is needed after login
    needsSync: store.needsSync(),
    shouldAttemptSync: store.shouldAttemptSync(),

    // Get items for syncing to server
    getLocalCartItems: () => store.items,

    // Handle sync success/failure
    handleSyncSuccess: () => {
      store.markSyncSuccess();
      toast.success("Cart synced successfully!", {
        description: "Your items are now saved to your account",
        classNames: {
          toast: "bg-[#e8f8e8] border-green-500",
          icon: "text-[#03a53e]",
          title: "text-[#03a53e]",
          description: "text-black",
        },
      });
    },

    handleSyncFailure: (error?: string) => {
      store.markSyncFailure();
      const attempts = store.syncAttempts;

      if (attempts >= 3) {
        toast.error("Sync failed", {
          description: "Items remain in your cart. Try refreshing the page.",
          classNames: {
            toast: "bg-[#ffebeb] border-[#ef4444]",
            icon: "text-[#ef4444]",
            title: "text-[#ef4444]",
            description: "text-black",
          },
        });
      } else {
        toast.warning("Sync failed, retrying...", {
          description: `Attempt ${attempts}/3`,
          classNames: {
            toast: "bg-[#fff3cd] border-[#ffc107]",
            icon: "text-[#856404]",
            title: "text-[#856404]",
            description: "text-black",
          },
        });
      }
    },
  };
};
