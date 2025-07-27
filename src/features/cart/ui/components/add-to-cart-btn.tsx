"use client";

import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { CartItemType } from "../../schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ShoppingCart, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  product: CartItemType;
};

export const AddToLocalCartButton = ({ product }: Props) => {
  const { addLocalCartItem, isInCart } = useLocalCartStore();
  const [isLoading, setIsLoading] = useState(false);

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
        quantity: 1,
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
        disabled={isLoading}
      >
        {isLoading ? (
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

      {isProductInCart && !isLoading && (
        <Badge
          variant="secondary"
          className="absolute -top-2 -right-2 h-5 min-w-5 p-1 text-xs flex items-center justify-center bg-blue-500 text-white"
        >
          <Plus className="w-2 h-2" />
        </Badge>
      )}
    </div>
  );
};

export const AddToServerCartButton = ({
  product,
}: {
  product: CartItemType;
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
        queryClient.invalidateQueries(trpc.cart.getUserCart.queryOptions());

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
        onClick={() => addItemToCart.mutate(product)}
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

      {isInCart && !addItemToCart.isPending && (
        <Badge
          variant="secondary"
          className="absolute -top-2 -right-2 h-5 min-w-5 p-1 text-xs flex items-center justify-center bg-blue-500 text-white"
        >
          <Plus className="w-2 h-2" />
        </Badge>
      )}
    </div>
  );
};

export const AddToCartButton = ({ product }: { product: CartItemType }) => {
  const user = useUser();

  return user.isSignedIn ? (
    <AddToServerCartButton product={product} />
  ) : (
    <AddToLocalCartButton product={product} />
  );
};
