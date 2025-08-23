"use client";

import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { LocalCartItemType } from "../../schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCartSyncContext } from "@/features/cart/hooks/cart-sync-context";
import { cn } from "@/lib/utils";

type Props = {
  product: LocalCartItemType;
  quantity?: number;
  availableStock?: number;
  label?: string;
  appearance?: "primary" | "subtle";
};

export const AddToLocalCartButton = ({
  product,
  quantity = 1,
  availableStock,
  label,
  appearance = "primary",
}: Props) => {
  const { addLocalCartItem, isInCart, items } = useLocalCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const { isSyncing } = useCartSyncContext();

  // Get current quantity in local cart
  const currentCartQuantity =
    items.find((item) => {
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
        className={
          appearance === "primary"
            ? "bg-[#C5F82A] text-black hover:bg-[#B4E729] w-full relative"
            : "h-8 px-3 text-xs"
        }
        variant={appearance === "primary" ? undefined : "outline"}
        size={appearance === "primary" ? undefined : "sm"}
        onClick={handleAddToCart}
        disabled={
          isLoading ||
          isSyncing ||
          (availableStock !== undefined && availableStock === 0) ||
          (availableStock !== undefined &&
            availableStock > 0 &&
            currentCartQuantity >= availableStock)
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {appearance === "primary" ? "Adding..." : ""}
          </>
        ) : isSyncing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {appearance === "primary" ? "Syncing..." : ""}
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {label || (appearance === "primary" ? "Add to Cart" : "Add")}
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
  label,
  appearance = "primary",
}: {
  product: LocalCartItemType;
  quantity?: number;
  availableStock?: number;
  label?: string;
  appearance?: "primary" | "subtle";
}) => {
  const [isInCart, setIsInCart] = useState(false);
  const [currentCartQuantity, setCurrentCartQuantity] = useState(0);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const cart = useQuery(trpc.cart.getUserCart.queryOptions());

  useEffect(() => {
    if (cart.data?.cartItems) {
      // Find matching cart item and get its quantity
      const matchingItem = cart.data.cartItems.find((cartItem) => {
        if (product.type === "product" && product.productId) {
          if (product.selectedVariantSku) {
            return (
              cartItem.productId === product.productId &&
              cartItem.selectedVariantSku === product.selectedVariantSku
            );
          } else {
            return (
              cartItem.productId === product.productId &&
              !cartItem.selectedVariantSku
            );
          }
        } else if (product.type === "course" && product.courseId) {
          return cartItem.courseId === product.courseId;
        }
        return false;
      });

      const currentQuantity = matchingItem?.quantity || 0;
      setCurrentCartQuantity(currentQuantity);
      setIsInCart(currentQuantity > 0);
    } else {
      setCurrentCartQuantity(0);
      setIsInCart(false);
    }
  }, [cart.data?.cartItems, product]);

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
          description: isInCart
            ? "Quantity updated"
            : "Item added successfully",
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
    <div
      className={cn(
        "relative flex-1",
        appearance === "subtle" && "w-fit flex-none"
      )}
    >
      <Button
        className={cn(
          "bg-[#C5F82A] text-black hover:bg-[#B4E729] w-full relative",
          appearance === "subtle" && "h-6 px-3 text-xs w-fit"
        )}
        size={appearance === "primary" ? undefined : "sm"}
        onClick={handleAddToCart}
        disabled={
          addItemToCart.isPending ||
          (availableStock !== undefined && availableStock === 0) ||
          (availableStock !== undefined &&
            availableStock > 0 &&
            currentCartQuantity >= availableStock)
        }
      >
        {addItemToCart.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {appearance === "primary" ? "Adding..." : ""}
          </>
        ) : (
          <>
            {appearance !== "subtle" && (
              <ShoppingCart className="w-4 h-4 mr-2" />
            )}
            {label || "Add to Cart"}
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
  label,
  appearance,
}: {
  product: LocalCartItemType;
  quantity?: number;
  availableStock?: number;
  label?: string;
  appearance?: "primary" | "subtle";
}) => {
  const user = useUser();

  return user.isSignedIn ? (
    <AddToServerCartButton
      product={product}
      quantity={quantity}
      availableStock={availableStock}
      label={label}
      appearance={appearance}
    />
  ) : (
    <AddToLocalCartButton
      product={product}
      quantity={quantity}
      availableStock={availableStock}
      label={label}
      appearance={appearance}
    />
  );
};
