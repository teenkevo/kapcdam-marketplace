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
import { useCartSync } from "@/features/cart/hooks/use-cart-sync";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import {
  useMutation,
  useQueryClient,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { CartType } from "@/features/cart/schema";

type Props = {
  userCart: CartType | null;
};

function AuthenticatedCartSheet({ userCart }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  const { setIsCartOpen, isCartOpen } = useLocalCartStore();
  const { isSyncing } = useCartSync();

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

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const items = userCart?.cartItems || [];
  const itemCount = userCart?.itemCount || 0;
  const totalPrice = userCart?.subtotal || 0;

  const handleUpdateQuantity = (itemIndex: number, newQuantity: number) => {
    if (!userCart?._id) return;
    updateServerCartMutation.mutate({
      cartId: userCart._id,
      itemIndex,
      quantity: newQuantity,
    });
  };

  const handleRemoveItem = (itemIndex: number) => {
    if (!userCart?._id) return;
    updateServerCartMutation.mutate({
      cartId: userCart._id,
      itemIndex,
      quantity: 0,
    });
  };

  const getDisplayPrice = (item: any) => item.currentPrice || 0;

  const getSelectedVariant = (item: any) => {
    if (
      item.type === "product" &&
      item.product?.hasVariants &&
      item.selectedVariantSku &&
      item.product.variants
    ) {
      return item.product.variants.find(
        (variant: any) => variant.sku === item.selectedVariantSku
      );
    }
    return null;
  };

  const getDisplayTitle = (item: any) => {
    if (item.type === "product" && item.product) {
      const selectedVariant = getSelectedVariant(item);

      if (selectedVariant && selectedVariant.attributes) {
        const variantText = selectedVariant.attributes
          .map((attr: any) => attr.value)
          .join(", ");
        return `${item.product.title} - ${variantText}`;
      } else if (item.selectedVariantSku) {
        return `${item.product.title} (${item.selectedVariantSku})`;
      }

      return item.product.title;
    } else if (item.type === "course" && item.course) {
      return item.course.title;
    }
    return "Unknown Item";
  };

  const getDisplayImage = (item: any) => {
    if (item.type === "product" && item.product?.defaultImage) {
      return urlFor(item.product.defaultImage).width(80).height(80).url();
    } else if (item.type === "course" && item.course?.defaultImage) {
      return urlFor(item.course.defaultImage).width(80).height(80).url();
    }
    return `/placeholder.svg?height=80&width=80`;
  };

  const getItemKey = (item: any, index: number) => {
    const baseId = item.product?._id || item.course?._id || index;
    const variantKey = item.selectedVariantSku || "";
    return `${item.type}-${baseId}-${variantKey}`;
  };

  const CartContent = () => (
    <div className="flex flex-col h-full">
      {isSyncing && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <p className="text-sm text-blue-700">Syncing your cart...</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pt-4 px-4 md:px-0">
        {itemCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500">Add some products to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item: any, index: number) => (
              <div
                key={getItemKey(item, index)}
                className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg"
              >
                <Image
                  src={getDisplayImage(item)}
                  alt={getDisplayTitle(item)}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {getDisplayTitle(item)}
                  </h4>
                  <p className="text-sm text-gray-500">Kapcdam Marketplace</p>
                  <div className="flex items-center">
                    <NumericFormat
                      thousandSeparator={true}
                      displayType="text"
                      prefix="UGX "
                      value={getDisplayPrice(item)}
                      className="text-sm font-semibold"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleUpdateQuantity(index, item.quantity - 1)
                    }
                    disabled={updateServerCartMutation.isPending || isSyncing}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">
                    {item.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleUpdateQuantity(index, item.quantity + 1)
                    }
                    disabled={updateServerCartMutation.isPending || isSyncing}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveItem(index)}
                    disabled={updateServerCartMutation.isPending || isSyncing}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {itemCount > 0 && (
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
            disabled={isSyncing}
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
            <DrawerTitle>Shopping Cart ({itemCount} items)</DrawerTitle>
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
          <SheetTitle>Shopping Cart ({itemCount} items)</SheetTitle>
        </SheetHeader>
        <CartContent />
      </SheetContent>
    </Sheet>
  );
}

// Local CartSheet - for unauthenticated users
function LocalCartSheet() {
  const [isMobile, setIsMobile] = useState(false);

  const {
    items: localItems,
    updateQuantity: updateLocalQuantity,
    removeItem: removeLocalItem,
    itemCount: localItemCount,
    isCartOpen,
    setIsCartOpen,
    getTotalPrice: getLocalTotalPrice,
  } = useLocalCartStore();

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const itemCount = localItemCount();
  const totalPrice = getLocalTotalPrice();

  const handleUpdateQuantity = (
    itemIndex: number,
    newQuantity: number,
    productId?: string,
    courseId?: string,
    selectedVariantSku?: string
  ) => {
    updateLocalQuantity(
      productId || "",
      courseId || "",
      selectedVariantSku,
      newQuantity
    );
  };

  const handleRemoveItem = (
    itemIndex: number,
    productId?: string,
    courseId?: string,
    selectedVariantSku?: string
  ) => {
    removeLocalItem(productId, courseId, selectedVariantSku);
  };

  const getDisplayTitle = (item: any) =>
    `Product ${item.type === "course" ? "Course" : ""}`;

  const getDisplayImage = () => `/placeholder.svg?height=80&width=80`;

  const getItemKey = (item: any, index: number) => {
    const baseId = item.productId || item.courseId || index;
    const variantKey = item.selectedVariantSku || "";
    return `${item.type}-${baseId}-${variantKey}`;
  };

  const CartContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pt-4 px-4 md:px-0">
        {itemCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500">Add some products to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {localItems.map((item: any, index: number) => (
              <div
                key={getItemKey(item, index)}
                className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg"
              >
                <Image
                  src={getDisplayImage()}
                  alt={getDisplayTitle(item)}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {getDisplayTitle(item)}
                  </h4>
                  <p className="text-sm text-gray-500">Kapcdam Marketplace</p>
                  <p className="text-xs text-blue-600">Sign in to see prices</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleUpdateQuantity(
                        index,
                        item.quantity - 1,
                        item.productId,
                        item.courseId,
                        item.selectedVariantSku
                      )
                    }
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">
                    {item.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleUpdateQuantity(
                        index,
                        item.quantity + 1,
                        item.productId,
                        item.courseId,
                        item.selectedVariantSku
                      )
                    }
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleRemoveItem(
                        index,
                        item.productId,
                        item.courseId,
                        item.selectedVariantSku
                      )
                    }
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {itemCount > 0 && (
        <div className="border-t p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-sm text-blue-600">Sign in to see total</span>
          </div>
          <Button
            className="w-full bg-[#C5F82A] text-black hover:bg-[#B4E729]"
            disabled
          >
            Sign in to Checkout
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
            <DrawerTitle>Shopping Cart ({itemCount} items)</DrawerTitle>
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
          <SheetTitle>Shopping Cart ({itemCount} items)</SheetTitle>
        </SheetHeader>
        <CartContent />
      </SheetContent>
    </Sheet>
  );
}

export function CartSheet({ userCart }: Props) {
  const { userId } = useAuth();

  // Render appropriate version based on auth status
  return userId ? (
    <AuthenticatedCartSheet userCart={userCart} />
  ) : (
    <LocalCartSheet />
  );
}
