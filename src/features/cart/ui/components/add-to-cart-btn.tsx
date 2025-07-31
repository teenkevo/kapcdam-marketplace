"use client";

import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { CartItemType } from "../../schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCartSync } from "@/features/cart/hooks/use-cart-sync";

type Props = {
  product: CartItemType;
  quantity?: number;
};

export const AddToLocalCartButton = ({ product, quantity = 1 }: Props) => {
  const { addLocalCartItem, isInCart } = useLocalCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const { isSyncing } = useCartSync();

  const isProductInCart = isInCart(
    product.productId ?? undefined,
    product.courseId ?? undefined,
    product.selectedVariantSku ?? undefined
  );

  const handleAddToCart = async () => {
    setIsLoading(true);

    try {
      addLocalCartItem({
        type: product.type,
        productId: product.productId,
        courseId: product.courseId,
        selectedVariantSku: product.selectedVariantSku,
        quantity: quantity,
      });

      if (isProductInCart) {
        toast.success("Quantity updated!", {
          description: "Item quantity increased in cart",
        });
      } else {
        toast.success("Added to cart!", {
          description: "Sign in to sync your cart",
        });
      }
    } finally {
      // Add small delay for better UX
      setTimeout(() => setIsLoading(false), 500);
    }
  };

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

        if (isInCart) {
          toast.success("Quantity updated!", {
            description: "Item quantity increased in cart",
          });
        } else {
          toast.success("Added to cart!", {
            description: "Item successfully added to your cart",
          });
        }
      },
      onError: (error) => {
        toast.error("Failed to add to cart", {
          description: error.message,
        });
      },
    })
  );

  return (
    <div className="relative flex-1">
      <Button
        className="bg-[#C5F82A] text-black hover:bg-[#B4E729] w-full"
        onClick={() => addItemToCart.mutate({ ...product, quantity })}
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
