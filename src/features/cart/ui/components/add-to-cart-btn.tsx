"use client";

import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { CartItemType } from "../../schema";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCartSync } from "@/features/cart/hooks/use-cart-sync";
import { useThrottle } from "@/hooks/use-debounce";
import { useCartToasts } from "@/features/cart/hooks/use-cart-toasts";

type Props = {
  product: CartItemType;
  quantity?: number;
};

export const AddToLocalCartButton = ({ product, quantity = 1 }: Props) => {
  const { addLocalCartItem, isInCart } = useLocalCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const { isSyncing } = useCartSync();
  const { addToCartSuccess, updateQuantitySuccess } = useCartToasts();

  const isProductInCart = isInCart(
    product.productId ?? undefined,
    product.courseId ?? undefined,
    product.selectedVariantSku ?? undefined
  );

  const handleAddToCartInternal = async () => {
    // Prevent if already loading or syncing
    if (isLoading || isSyncing) return;

    setIsLoading(true);

    try {
      addLocalCartItem({
        type: product.type,
        productId: product.productId,
        courseId: product.courseId,
        selectedVariantSku: product.selectedVariantSku,
        quantity: quantity,
      });

      // Show appropriate toast based on whether item was already in cart
      if (isProductInCart) {
        updateQuantitySuccess();
      } else {
        addToCartSuccess(false, quantity); // false = not signed in
      }
    } finally {
      // Quick loading state for immediate feedback
      setTimeout(() => setIsLoading(false), 200);
    }
  };

  // Throttled version to prevent rapid clicks
  const handleAddToCart = useThrottle(handleAddToCartInternal, 600);

  return (
    <div className="relative flex-1">
      <Button
        className="bg-[#C5F82A] text-black hover:bg-[#B4E729] w-full relative"
        onClick={handleAddToCart}
        disabled={isLoading || isSyncing}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : isSyncing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </>
        )}
      </Button>
    </div>
  );
};

export const AddToServerCartButton = ({
  product,
  quantity = 1,
}: {
  product: CartItemType;
  quantity?: number;
}) => {
  const [isInCart, setIsInCart] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { addToCartSuccess, updateQuantitySuccess, addToCartError } = useCartToasts();


  const cart = useQuery(trpc.cart.getUserCart.queryOptions());

  useEffect(() => {
    if (cart.data) {
      const inCart = cart.data?.cartItems.some((cartItem) => {
        if (product.type === "product" && product.productId) {
          if (product.selectedVariantSku) {
            return (
              cartItem.productId === product.productId &&
              cartItem.selectedVariantSku === product.selectedVariantSku
            );
          } else {
            return cartItem.productId === product.productId;
          }
        } else if (product.type === "course" && product.courseId) {
          return cartItem.courseId === product.courseId;
        }
        return false;
      });

      setIsInCart(inCart ?? false);
    }
  }, [cart.data, product]);

  const addItemToCart = useMutation(
    trpc.cart.addToCart.mutationOptions({
      onSuccess: async () => {
        // Force refetch for consistency with cart-sheet
        queryClient.refetchQueries(trpc.cart.getUserCart.queryOptions());
        queryClient.refetchQueries({
          queryKey: ["cart", "getDisplayData"],
        });

        // Show appropriate toast based on whether item was already in cart
        if (isInCart) {
          updateQuantitySuccess();
        } else {
          addToCartSuccess(true, quantity); // true = signed in
        }
      },
      onError: (error) => {
        addToCartError(error.message);
      },
    })
  );

  // Throttled mutation function to prevent rapid clicks
  const handleServerAddToCart = useThrottle(() => {
    if (addItemToCart.isPending) return; // Prevent if already pending
    addItemToCart.mutate({ ...product, quantity });
  }, 600);

  return (
    <div className="relative flex-1">
      <Button
        className="bg-[#C5F82A] text-black hover:bg-[#B4E729] w-full"
        onClick={handleServerAddToCart}
        disabled={addItemToCart.isPending}
      >
        {addItemToCart.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </>
        )}
      </Button>
    </div>
  );
};

export const AddToCartButton = ({ product, quantity }: { product: CartItemType; quantity?: number }) => {
  const user = useUser();

  return user.isSignedIn ? (
    <AddToServerCartButton product={product} quantity={quantity} />
  ) : (
    <AddToLocalCartButton product={product} quantity={quantity} />
  );
};
