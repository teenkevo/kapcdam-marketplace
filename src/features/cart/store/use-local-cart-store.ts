import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import type { LocalCartItemType } from "@/modules/cart/schema";

interface LocalCartState {
  // State
  items: LocalCartItemType[];
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;
  lastUpdated: Date | null;

  // Actions
  addItem: (item: Omit<LocalCartItemType, "addedAt">) => void;
  removeItem: (
    productId?: string,
    courseId?: string,
    variantSku?: string
  ) => void;
  updateQuantity: (
    productId: string,
    courseId: string,
    variantSku: string | undefined,
    quantity: number
  ) => void;
  clearCart: () => void;
  setIsCartOpen: (isOpen: boolean) => void;
  syncToServer: (clerkUserId: string) => Promise<boolean>;

  // Computed
  isCartOpen: boolean;
  itemCount: () => number;
  isEmpty: () => boolean;
  hasItems: () => boolean;
}

export const useLocalCartStore = create<LocalCartState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        items: [],
        isLoading: false,
        error: null,
        isSyncing: false,
        lastUpdated: null,
        isCartOpen: false,

        // Actions
        addItem: (newItem) => {
          set((state) => {
            const itemWithTimestamp = {
              ...newItem,
              addedAt: new Date(),
            };

            // Check if item already exists
            const existingIndex = state.items.findIndex((item) => {
              if (newItem.type === "product") {
                return (
                  item.productId === newItem.productId &&
                  item.selectedVariantSku === newItem.selectedVariantSku
                );
              } else {
                return item.courseId === newItem.courseId;
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
              error: null,
            };
          });

          toast.success("Item added to your cart successfully!");
        },

        setIsCartOpen: (isOpen) => {
          set({ isCartOpen: isOpen });
        },

        removeItem: (productId, courseId, variantSku) => {
          set((state) => ({
            items: state.items.filter((item) => {
              if (item.type === "product") {
                return !(
                  item.productId === productId &&
                  item.selectedVariantSku === variantSku
                );
              } else {
                return item.courseId !== courseId;
              }
            }),
            lastUpdated: new Date(),
          }));
        },

        updateQuantity: (productId, courseId, variantSku, quantity) => {
          if (quantity <= 0) {
            get().removeItem(productId, courseId, variantSku);
            return;
          }

          set((state) => ({
            items: state.items.map((item) => {
              if (item.type === "product") {
                if (
                  item.productId === productId &&
                  item.selectedVariantSku === variantSku
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
            error: null,
          });
        },

        syncToServer: async (clerkUserId: string) => {
          const { items } = get();

          if (items.length === 0) {
            return true;
          }

          set({ isSyncing: true, error: null });

          try {
            const syncCart = trpc.cart.syncCartToUser.useMutation();

            const result = await syncCart.mutateAsync({
              clerkUserId,
              localCartItems: items,
            });
            if (result.success) {
              // Clear local cart after successful sync
              get().clearCart();

              toast.success(
                `${result.success ? result.success : 0} items moved to your account.`
              );

              set({ isSyncing: false });
              return true;
            }
          } catch (error: any) {
            const errorMessage = getCartErrorMessage(error);

            set({
              isSyncing: false,
              error: errorMessage,
            });

            toast.error(errorMessage);

            return false;
          }

          set({ isSyncing: false });
          return false;
        },

        itemCount: () => {
          return get().items.reduce((total, item) => total + item.quantity, 0);
        },

        isEmpty: () => {
          return get().items.length === 0;
        },

        hasItems: () => {
          return get().items.length > 0;
        },
      }),
      {
        name: "kapcdam-cart-storage",
        partialize: (state) => ({
          items: state.items,
          lastUpdated: state.lastUpdated,
        }),
      }
    )
  )
);

// Helper function for error messages
function getCartErrorMessage(error: any): string {
  if (!error?.data?.code) return "Something went wrong";

  switch (error.data.code) {
    case "BAD_REQUEST":
      if (error.message.includes("Insufficient stock")) {
        return "Some items are out of stock";
      }
      return error.message;
    case "NOT_FOUND":
      return "Some items are no longer available";
    default:
      return "Unable to sync cart";
  }
}
