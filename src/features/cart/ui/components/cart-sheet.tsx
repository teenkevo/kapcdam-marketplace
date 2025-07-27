"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { NumericFormat } from "react-number-format";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import {
  useMutation,
  useQueryClient,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  CartDisplayCourseType,
  CartDisplayProductType,
  CartType,
} from "@/features/cart/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { ExpandedProduct, getDisplayTitle } from "../../helpers";

type Props = {
  cartDisplayData: {
    products: ExpandedProduct[];
    courses: CartDisplayCourseType[];
  } | null;
  totalItems: number;
  userCart: CartType | null;
};

export function CartSheet({ cartDisplayData, totalItems, userCart }: Props) {
  const isMobile = useIsMobile();
  const { setIsCartOpen, isCartOpen } = useLocalCartStore();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateServerCartMutation = useMutation(
    trpc.cart.updateCartItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.cart.getUserCart.queryOptions());
        toast.success("Cart updated successfully!");
      },
      onError: (error) => {
        toast.error(`Failed to update cart: ${error.message}`);
      },
    })
  );

  const findCartItemForProduct = (expandedProduct: ExpandedProduct) => {
    return userCart?.cartItems.find((cartItem) => {
      if (cartItem.type !== "product") return false;

      if (expandedProduct.isVariant) {
        return (
          cartItem.productId === expandedProduct.originalProductId &&
          cartItem.selectedVariantSku === expandedProduct.VariantSku
        );
      }

      return cartItem.productId === expandedProduct.originalProductId;
    });
  };


  const findCartItemIndex = (expandedProduct: ExpandedProduct) => {
    if (!userCart?.cartItems) return -1;

    return userCart.cartItems.findIndex((cartItem) => {
      if (cartItem.type !== "product") return false;

      if (expandedProduct.isVariant) {
        return (
          cartItem.productId === expandedProduct.originalProductId &&
          cartItem.selectedVariantSku === expandedProduct.VariantSku
        );
      }

      return cartItem.productId === expandedProduct.originalProductId;
    });
  };

  const totalPrice =
    userCart?.cartItems.reduce((acc, cartItem) => {
      if (cartItem.type === "product") {
        // Find the corresponding expanded product to get current price
        const expandedProduct = cartDisplayData?.products.find((p) => {
          if (cartItem.selectedVariantSku) {
            return (
              p.originalProductId === cartItem.productId &&
              p.VariantSku === cartItem.selectedVariantSku
            );
          }
          return p.originalProductId === cartItem.productId && !p.isVariant;
        });

        const price = expandedProduct ? parseInt(expandedProduct.price) : 0;
        return acc + price * cartItem.quantity;
      }

      return acc;
    }, 0) || 0;

  const handleUpdateQuantity = (
    expandedProduct: ExpandedProduct,
    newQuantity: number
  ) => {
    if (!userCart?._id) return;

    const itemIndex = findCartItemIndex(expandedProduct);
    if (itemIndex === -1) return;

    updateServerCartMutation.mutate({
      cartId: userCart._id,
      itemIndex,
      quantity: newQuantity,
    });
  };

  const handleRemoveItem = (expandedProduct: ExpandedProduct) => {
    if (!userCart?._id) return;

    const itemIndex = findCartItemIndex(expandedProduct);
    if (itemIndex === -1) return;

    updateServerCartMutation.mutate({
      cartId: userCart._id,
      itemIndex,
      quantity: 0,
    });
  };

  const CartContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pt-4 px-4 md:px-0">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500">Add some products to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartDisplayData?.products.map((expandedProduct) => {
              const cartItem = findCartItemForProduct(expandedProduct);
              if (!cartItem) return null; // Skip if no corresponding cart item

              return (
                <div
                  key={expandedProduct._id}
                  className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg"
                >
                  <Image
                    src={urlFor(expandedProduct.defaultImage)
                      .width(80)
                      .height(80)
                      .url()}
                    alt={expandedProduct.title}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {expandedProduct.title}
                    </h4>
                    <p className="text-sm text-gray-500">Kapcdam Marketplace</p>
                    <div className="flex items-center">
                      <NumericFormat
                        thousandSeparator={true}
                        displayType="text"
                        prefix="UGX "
                        value={expandedProduct.price}
                        className="text-sm font-semibold"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleUpdateQuantity(
                          expandedProduct,
                          cartItem.quantity - 1
                        )
                      }
                      disabled={updateServerCartMutation.isPending}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">
                      {cartItem.quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleUpdateQuantity(
                          expandedProduct,
                          cartItem.quantity + 1
                        )
                      }
                      disabled={updateServerCartMutation.isPending}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveItem(expandedProduct)}
                      disabled={updateServerCartMutation.isPending}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalItems > 0 && (
        <div className="border-t p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total:</span>
            <NumericFormat
              thousandSeparator={true}
              displayType="text"
              prefix="UGX "
              value={totalPrice}
              className="text-lg font-bold"
            />
          </div>
          <Button
            className="w-full bg-[#C5F82A] text-black hover:bg-[#B4E729]"
            disabled={updateServerCartMutation.isPending}
          >
            Proceed to Checkout
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Shopping Cart ({totalItems} items)</DrawerTitle>
          </DrawerHeader>
          <CartContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Shopping Cart ({totalItems} items)</SheetTitle>
        </SheetHeader>
        <CartContent />
      </SheetContent>
    </Sheet>
  );
}
