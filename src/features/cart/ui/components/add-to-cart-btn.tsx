"use client";

import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { CartItemType, CartType } from "../../schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

type Props = {
  product: CartItemType;
};

export const AddToLocalCartButton = ({ product }: Props) => {
  const { addLocalCartItem, isInCart } = useLocalCartStore();

  const isProductInCart = isInCart(
    product.productId ?? undefined,
    undefined,
    product.selectedVariantSku ?? undefined
  );

  if (isProductInCart) {
    return (
      <Button
        className={
          "bg-[#C5F82A] text-black flex-1 opacity-50 cursor-not-allowed"
        }
        disabled
      >
        In Basket
      </Button>
    );
  }

  const handleAddToCart = () => {
    addLocalCartItem({
      type: "product",
      productId: product.productId,
      selectedVariantSku: product.selectedVariantSku,
      quantity: 1,
      currentPrice: product.currentPrice,
    });
    toast.success(
      `${product.type === "product" ? "Product" : "Course"} added to cart!`
    );
  };

  return (
    <Button
      className="bg-[#C5F82A] text-black flex-1"
      onClick={handleAddToCart}
    >
      Add to Cart
    </Button>
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
    console.log("running...");
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

      console.log("In Cart", inCart);
      setIsInCart(inCart ?? false);
    }
  }, [cart.data, product]);

  const addItemToCart = useMutation(
    trpc.cart.addToCart.mutationOptions({
      onSuccess: async () => {
        queryClient.invalidateQueries(trpc.cart.getUserCart.queryOptions());
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  if (isInCart) {
    return (
      <Button
        className="bg-[#C5F82A] text-black flex-1 opacity-70 cursor-not-allowed"
        disabled
      >
        In Basket
      </Button>
    );
  }

  return (
    <Button
      className="bg-[#C5F82A] text-black flex-1"
      onClick={() => addItemToCart.mutate(product)}
    >
      Add to Cart
    </Button>
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
