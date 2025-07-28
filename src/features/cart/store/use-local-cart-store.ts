import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { toast } from "sonner";
import type { CartItemType } from "@/features/cart/schema";

interface LocalCartState {
  // State
  items: CartItemType[];
  isCartOpen: boolean;
  lastUpdated: Date | null;

  // Actions
  addLocalCartItem: (item: Omit<CartItemType, "addedAt">) => void;
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
  isInCart: (
    productId?: string,
    courseId?: string,
    selectedVariantSku?: string
  ) => boolean;

  // Computed
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
        isCartOpen: false,
        lastUpdated: null,

        // Actions
        addLocalCartItem: (newItem) => {
          set((state) => {
            const itemWithTimestamp = {
              ...newItem,
              addedAt: `${new Date()}`,
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

          toast.success("Added to cart successfully!", {
            description: "Sign in to sync your cart",
          });
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
        }),
      }
    )
  )
);
