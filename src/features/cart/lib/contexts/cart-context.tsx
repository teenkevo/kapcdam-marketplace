"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Product } from "@root/sanity.types";
import { useUser } from "@clerk/nextjs";
import { trpc } from "@/trpc/client";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isLoading: boolean;
  syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "shopping-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isSignedIn } = useUser();
  
  const addToCartMutation = trpc.cart.addToCart.useMutation();
  const updateCartItemMutation = trpc.cart.updateCartItem.useMutation();
  const clearCartMutation = trpc.cart.clearCart.useMutation();
  const syncCartMutation = trpc.cart.syncCartToUser.useMutation();
  
  const { data: userCart, refetch: refetchUserCart } = trpc.cart.getUserCart.useQuery(
    { userId: user?.id || "" },
    { enabled: !!user?.id && isSignedIn }
  );

  // Load cart data based on auth state
  useEffect(() => {
    if (isSignedIn && userCart) {
      const cartItems = userCart.cartItems?.map((item: any) => ({
        id: item.product?._id || item.course?._id,
        product: item.product || item.course,
        quantity: item.quantity,
      })) || [];
      setItems(cartItems);
      setIsLoaded(true);
    } else if (!isSignedIn) {
      // Load from localStorage for guest users
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setItems(parsedCart);
        }
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      } finally {
        setIsLoaded(true);
      }
    }
  }, [isSignedIn, userCart]);

  // Save cart to localStorage for guest users only
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error("Error saving cart to localStorage:", error);
      }
    }
  }, [items, isLoaded, isSignedIn]);

  const addToCart = async (product: Product) => {
    setIsLoading(true);
    try {
      if (isSignedIn && user?.id) {
        await addToCartMutation.mutateAsync({
          userId: user.id,
          item: {
            type: "product",
            quantity: 1,
            currentPrice: parseInt(product.price || "0"),
            product: product._id,
          },
        });
        await refetchUserCart();
      } else {
        // Guest users: only update localStorage
        setItems((currentItems) => {
          const existingItem = currentItems.find((item) => item.id === product._id);
          if (existingItem) {
            return currentItems.map((item) =>
              item.id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }
          return [...currentItems, { id: product._id, product, quantity: 1 }];
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    setIsLoading(true);
    try {
      if (isSignedIn && userCart) {
        const cartItem = userCart.cartItems?.find(
          (item: any) => (item.product?._id || item.course?._id) === productId
        );
        
        if (cartItem) {
          await updateCartItemMutation.mutateAsync({
            cartId: userCart._id,
            itemId: cartItem._key,
            quantity: 0,
          });
          await refetchUserCart();
        }
      }
      
      // Update local state for both auth and guest users
      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== productId)
      );
    } catch (error) {
      console.error("Error removing from cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    setIsLoading(true);
    try {
      if (isSignedIn && userCart) {
        const cartItem = userCart.cartItems?.find(
          (item: any) => (item.product?._id || item.course?._id) === productId
        );
        
        if (cartItem) {
          await updateCartItemMutation.mutateAsync({
            cartId: userCart._id,
            itemId: cartItem._key,
            quantity,
          });
          await refetchUserCart();
        }
      }
      
      // Update local state for both auth and guest users
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      if (isSignedIn && userCart) {
        await clearCartMutation.mutateAsync({ cartId: userCart._id });
        await refetchUserCart();
      }
      
      setItems([]);
      if (!isSignedIn) {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce(
      (total, item) =>
        total + parseInt(item?.product?.price ?? "0") * item.quantity,
      0
    );
  };

  const syncCart = useCallback(async () => {
    if (!isSignedIn || !user?.id) return;
    
    setIsLoading(true);
    try {
      const localCartItems = items.map((item) => ({
        type: "product" as const,
        quantity: item.quantity,
        currentPrice: parseInt(item.product.price || "0"),
        product: item.product._id,
      }));
      
      await syncCartMutation.mutateAsync({
        userId: user.id,
        localCartItems,
      });
      
      // Clear local storage after sync
      localStorage.removeItem(CART_STORAGE_KEY);
      
      await refetchUserCart();
    } catch (error) {
      console.error("Error syncing cart:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user?.id, items, isLoaded, syncCartMutation, refetchUserCart, isLoaded]);

  // Auto-sync cart when user signs in
  useEffect(() => {
    if (isSignedIn && user?.id && items.length > 0 && isLoaded) {
      syncCart();
    }
  }, [isSignedIn, user?.id, isLoaded, syncCart, items.length]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        isCartOpen,
        setIsCartOpen,
        isLoading,
        syncCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}