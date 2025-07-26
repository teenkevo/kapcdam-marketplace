import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { toast } from "sonner";
import type { LocalCartItemType } from "@/modules/cart/schema";

interface LocalCartState {
  // State
  items: LocalCartItemType[];
  isCartOpen: boolean;
  lastUpdated: Date | null;

  // Actions
  addLocalCartItem: (item: Omit<LocalCartItemType, "addedAt">) => void;
  removeItem: (
    productId?: string,
    courseId?: string,
    selectedVariantSku?: string
  ) => void;
  updateQuantity: (
    productId: string,
    courseId: string,
    selectedVariantSku: string | undefined,
    quantity: number
  ) => void;
  clearCart: () => void;
  setIsCartOpen: (isOpen: boolean) => void;

  // Computed
  itemCount: () => number;
  isEmpty: () => boolean;
  hasItems: () => boolean;
  getTotalPrice: () => number;
}

export const useLocalCartStore = create<LocalCartState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        items: [],
        isCartOpen: false,
        lastUpdated: null,

        // Actions
        addLocalCartItem: (newItem) => {
          set((state) => {
            const itemWithTimestamp = {
              ...newItem,
              addedAt: new Date(),
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

          toast.success("Item added to your cart successfully!");
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

          toast.success("Item removed from cart");
        },

        updateQuantity: (productId, courseId, selectedVariantSku, quantity) => {
          if (quantity <= 0) {
            get().removeItem(productId, courseId, selectedVariantSku);
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
          });
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

        getTotalPrice: () => {
          // For local cart, we can't calculate total without server prices
          // Return 0 and handle pricing on server sync
          return 0;
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
