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
  availableStock?: number;
};

export const AddToLocalCartButton = ({ product, quantity = 1, availableStock }: Props) => {
  const { addLocalCartItem, isInCart, items } = useLocalCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const { isSyncing } = useCartSync();

  const isProductInCart = isInCart(
    product.productId ?? undefined,
    product.courseId ?? undefined,
    product.selectedVariantSku ?? undefined
  );

  // Get current quantity in local cart
  const currentCartQuantity = items.find((item) => {
    if (product.type === "product" && product.productId) {
      if (product.selectedVariantSku) {
        return (
          item.type === "product" &&
          item.productId === product.productId &&
          item.selectedVariantSku === product.selectedVariantSku
        );
      } else {
        return (
          item.type === "product" &&
          item.productId === product.productId &&
          !item.selectedVariantSku
        );
      }
    } else if (product.type === "course" && product.courseId) {
      return item.type === "course" && item.courseId === product.courseId;
    }
    return false;
  })?.quantity || 0;

  const handleAddToCart = async () => {
    // Validate stock considering current cart quantity
    if (availableStock !== undefined && availableStock > 0) {
      const totalQuantityAfterAdd = currentCartQuantity + quantity;
      if (totalQuantityAfterAdd > availableStock) {
        toast.error("Maximum stock reached", {
          description: `${availableStock} available, ${currentCartQuantity} already in cart`,
          classNames: {
            toast: "bg-[#ffebeb] border-[#ef4444]",
            icon: "text-[#ef4444]",
            title: "text-[#ef4444]",
            description: "text-black",
          },
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      addLocalCartItem({
        type: product.type,
        productId: product.productId,
        courseId: product.courseId,
        selectedVariantSku: product.selectedVariantSku,
        quantity: quantity,
      });
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
        disabled={
          isLoading || isSyncing ||
          (availableStock !== undefined && availableStock === 0) ||
          (availableStock !== undefined && availableStock > 0 && currentCartQuantity >= availableStock)
        }
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
  availableStock,
}: {
  product: CartItemType;
  quantity?: number;
  availableStock?: number;
}) => {
  const [isInCart, setIsInCart] = useState(false);
  const [currentCartQuantity, setCurrentCartQuantity] = useState(0);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const cart = useQuery(trpc.cart.getUserCart.queryOptions());

  useEffect(() => {
    if (cart.data) {
      // Find matching cart item and get its quantity
      const matchingItem = cart.data?.cartItems.find((cartItem) => {
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

      const currentQuantity = matchingItem?.quantity || 0;
      setCurrentCartQuantity(currentQuantity);
      setIsInCart(currentQuantity > 0);
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

        // Consolidate into single cart success message
        toast.success("Added to cart!", {
          description: isInCart ? "Quantity updated" : "Item added successfully",
          classNames: {
            toast: "bg-[#e8f8e8] border-green-500",
            icon: "text-[#03a53e]",
            title: "text-[#03a53e]",
            description: "text-black",
            actionButton: "bg-zinc-400",
            cancelButton: "bg-orange-400",
            closeButton: "bg-lime-400",
          },
        });
      },
      onError: (error) => {
        toast.error("Failed to add to cart", {
          description: error.message,
          classNames: {
            toast: "bg-[#ffebeb] border-[#ef4444]",
            icon: "text-[#ef4444]",
            title: "text-[#ef4444]",
            description: "text-black",
            actionButton: "bg-zinc-400",
            cancelButton: "bg-orange-400",
            closeButton: "bg-lime-400",
          },
        });
      },
    })
  );

  const handleAddToCart = () => {
    // Validate stock considering current cart quantity
    if (availableStock !== undefined && availableStock > 0) {
      const totalQuantityAfterAdd = currentCartQuantity + quantity;
      if (totalQuantityAfterAdd > availableStock) {
        toast.error("Maximum stock reached", {
          description: `${availableStock} available, ${currentCartQuantity} already in cart`,
          classNames: {
            toast: "bg-[#ffebeb] border-[#ef4444]",
            icon: "text-[#ef4444]",
            title: "text-[#ef4444]",
            description: "text-black",
          },
        });
        return;
      }
    }
    
    addItemToCart.mutate({ ...product, quantity });
  };

  return (
    <div className="relative flex-1">
      <Button
        className="bg-[#C5F82A] text-black hover:bg-[#B4E729] w-full"
        onClick={handleAddToCart}
        disabled={
          addItemToCart.isPending || 
          (availableStock !== undefined && availableStock === 0) ||
          (availableStock !== undefined && availableStock > 0 && currentCartQuantity >= availableStock)
        }
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

export const AddToCartButton = ({
  product,
  quantity,
  availableStock,
}: {
  product: CartItemType;
  quantity?: number;
  availableStock?: number;
}) => {
  const user = useUser();

  return user.isSignedIn ? (
    <AddToServerCartButton product={product} quantity={quantity} availableStock={availableStock} />
  ) : (
    <AddToLocalCartButton product={product} quantity={quantity} availableStock={availableStock} />
  );
};
