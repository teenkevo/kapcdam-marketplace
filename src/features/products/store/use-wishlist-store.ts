"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      isWishlistOpen: false,
      setIsWishlistOpen: (open) => set({ isWishlistOpen: open }),
    }),
    {
      name: "kapcdam-wishlist-ui",
      partialize: (state) => ({ isWishlistOpen: state.isWishlistOpen }),
    }
  )
);
