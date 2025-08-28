import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { toast } from "sonner";
import type { LocalCartItemType } from "@/features/cart/schema";

interface LocalCartState {
  items: LocalCartItemType[];
  isCartOpen: boolean;

  // Actions
  addLocalCartItem: (item: LocalCartItemType, showToast?: boolean) => void;
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

        // Actions
        addLocalCartItem: (newItem, showToast = true) => {
          set((state) => {
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
              updatedItems = [...state.items, newItem];
            }

            return { items: updatedItems };
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
          }));
        },

        clearCart: () => {
          set({ items: [] });
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
        }),
      }
    )
  )
);

