"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
import { motion, AnimatePresence } from "framer-motion";
import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { CartType } from "@/features/cart/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { ExpandedProduct, expandCartVariants } from "../../helpers";
import { cn } from "@/lib/utils";


export function CartSheet() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const {
    setIsCartOpen,
    isCartOpen,
    items: localItems,
    updateQuantity: updateLocalQuantity,
    removeItem: removeLocalItem,
    itemCount: getLocalItemCount,
  } = useLocalCartStore();

  const { isSignedIn } = useUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: userCart } = useQuery({
    ...trpc.cart.getUserCart.queryOptions(),
    enabled: isSignedIn,
  });

  // Final cart data for rendering (use userCart for signed-in users to reflect optimistic updates)
  const cartData = useMemo(() => {
    return isSignedIn ? userCart?.cartItems || [] : localItems;
  }, [isSignedIn, userCart?.cartItems, localItems]);

  // Memoize cartIds calculation for better performance
  const { productIds, courseIds, selectedSKUs } = useMemo(() => {
    if (!cartData || cartData.length === 0) {
      return { productIds: [], courseIds: [], selectedSKUs: [] };
    }
    const productIds = cartData
      .filter((item) => item.type === "product" && item.productId)
      .map((item) => item.productId!)
      .filter((id, index, arr) => arr.indexOf(id) === index);

    const courseIds = cartData
      .filter((item) => item.type === "course" && item.courseId)
      .map((item) => item.courseId!)
      .filter((id, index, arr) => arr.indexOf(id) === index);

    const selectedSKUs = cartData
      .filter((item) => item.type === "product" && item.selectedVariantSku)
      .map((item) => item.selectedVariantSku!)
      .filter((sku, index, arr) => arr.indexOf(sku) === index);

    return { productIds, courseIds, selectedSKUs };
  }, [cartData]);


  // Fetch display data regardless of auth state
  const { data: cartDisplayData, isLoading } = useQuery(
    trpc.cart.getDisplayData.queryOptions({
      productIds,
      courseIds,
      selectedSKUs,
    })
  );


  // Expand cart variants for display
  const expandedProducts = useMemo(() => {
    return cartDisplayData?.products
      ? expandCartVariants(cartDisplayData.products, cartData)
      : [];
  }, [cartDisplayData?.products, cartData]);

  // Server cart mutation with optimistic updates
  const updateServerCartMutation = useMutation(
    trpc.cart.updateCartItem.mutationOptions({
      onMutate: async (variables) => {
        // Cancel any outgoing refetches to avoid race conditions
        await queryClient.cancelQueries(trpc.cart.getUserCart.queryOptions());
        await queryClient.cancelQueries({
          queryKey: ["cart", "getDisplayData"],
        });

        // Snapshot the previous value for rollback
        const previousCart = queryClient.getQueryData(
          trpc.cart.getUserCart.queryOptions().queryKey
        );

        // Optimistically update the cache
        queryClient.setQueryData(
          trpc.cart.getUserCart.queryOptions().queryKey,
          (old: any) => {
            if (!old) return old;

            const updatedItems = [...old.cartItems];
            if (variables.quantity === 0) {
              // Remove item
              updatedItems.splice(variables.itemIndex, 1);
            } else {
              // Update quantity
              updatedItems[variables.itemIndex] = {
                ...updatedItems[variables.itemIndex],
                quantity: variables.quantity,
              };
            }

            // Recalculate totals
            const itemCount = updatedItems.reduce(
              (sum: number, item: any) => sum + item.quantity,
              0
            );

            return {
              ...old,
              cartItems: updatedItems,
              itemCount,
            };
          }
        );

        return { previousCart };
      },
      onError: (error, variables, context) => {
        // Rollback optimistic update on error
        if (context?.previousCart) {
          queryClient.setQueryData(
            trpc.cart.getUserCart.queryOptions().queryKey,
            context.previousCart
          );
        }
        toast.error(`Failed to update cart: ${error.message}`, {
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
      onSuccess: () => {
        // No need to invalidate queries since optimistic updates keep cache fresh
        // This prevents the second loading state
      },
    })
  );

  // Helper functions to find cart items
  const findCartItemForProduct = (expandedProduct: ExpandedProduct) => {
    return cartData.find((cartItem) => {
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
    if (!cartData) return -1;

    return cartData.findIndex((cartItem) => {
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

  // Calculate total price from expanded products
  const totalPrice = useMemo(() => {
    const total = cartData.reduce((acc, cartItem) => {
      if (cartItem.type === "product") {
        const expandedProduct = expandedProducts.find((p) => {
          if (cartItem.selectedVariantSku) {
            return (
              p.originalProductId === cartItem.productId &&
              p.VariantSku === cartItem.selectedVariantSku
            );
          }
          return p.originalProductId === cartItem.productId && !p.isVariant;
        });

        const price = expandedProduct
          ? Math.max(0, parseInt(expandedProduct.price) || 0)
          : 0;
        const quantity = Math.max(0, cartItem.quantity || 0);
        return acc + price * quantity;
      }

      if (cartItem.type === "course") {
        const course = cartDisplayData?.courses.find(
          (c) => c._id === cartItem.courseId
        );
        const price = course ? Math.max(0, parseInt(course.price) || 0) : 0;
        const quantity = Math.max(0, cartItem.quantity || 0);
        return acc + price * quantity;
      }

      return acc;
    }, 0);

    return Math.max(0, total); // Ensure total is never negative
  }, [cartData, expandedProducts, cartDisplayData?.courses]);

  // Handle quantity updates
  const handleUpdateQuantity = (
    expandedProduct: ExpandedProduct,
    newQuantity: number
  ) => {
    // Ensure quantity is between 1 and 99
    const safeQuantity = Math.max(1, Math.min(99, newQuantity));

    const cartId = userCart?._id;
    if (isSignedIn && cartId) {
      // Server cart update
      const itemIndex = findCartItemIndex(expandedProduct);
      if (itemIndex === -1) return;

      updateServerCartMutation.mutate({
        cartId,
        itemIndex,
        quantity: safeQuantity,
      });
    } else {
      // Local cart update
      updateLocalQuantity(
        expandedProduct.originalProductId,
        "", // courseId not needed for products
        expandedProduct.VariantSku,
        safeQuantity
      );
    }
  };

  // Handle item removal
  const handleRemoveItem = (expandedProduct: ExpandedProduct) => {
    const cartId = userCart?._id;
    if (isSignedIn && cartId) {
      // Server cart removal
      const itemIndex = findCartItemIndex(expandedProduct);
      if (itemIndex === -1) return;

      updateServerCartMutation.mutate({
        cartId,
        itemIndex,
        quantity: 0,
      });
    } else {
      // Local cart removal
      removeLocalItem(
        expandedProduct.originalProductId,
        "", // courseId not needed for products
        expandedProduct.VariantSku
      );
    }
  };

  // Get current total items count from the same data source used for rendering
  const currentTotalItems = useMemo(() => {
    return cartData.reduce((total, item) => total + item.quantity, 0);
  }, [cartData]);

  // Handle proceed to checkout
  const handleProceedToCheckout = () => {
    const cartId = userCart?._id;

    if (!isSignedIn) {
      const checkoutUrl = `/checkout`;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(checkoutUrl)}`);
      return;
    }

    // Close cart sheet and navigate to checkout with cart ID
    setIsCartOpen(false);
    router.push(`/checkout/c/${cartId}`);
  };

  const CartContent = () => (
    <div className="flex flex-col h-full relative">

      <div className="flex-1 overflow-y-auto pt-4 px-4 md:px-0">
        {currentTotalItems === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500">Add some products to get started!</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Render Products */}
            <AnimatePresence mode="popLayout">
              {expandedProducts.map((expandedProduct) => {
                const cartItem = findCartItemForProduct(expandedProduct);
                if (!cartItem) return null;

                // Enhanced key for better re-rendering
                const itemKey = `${expandedProduct._id}-${cartItem.quantity}-${expandedProduct.VariantSku || "no-variant"}`;

                return (
                  <motion.div
                    key={itemKey}
                    layout
                    initial={{ opacity: 1, x: 0, scale: 1 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      x: -100,
                      scale: 0.8,
                      transition: { duration: 0.3, ease: "easeInOut" },
                    }}
                    transition={{ duration: 0.2 }}
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
                      <h4
                        className="text-sm font-medium text-gray-900 truncate"
                        title={expandedProduct.originalTitle} // Tooltip with full title
                      >
                        {expandedProduct.title}
                      </h4>
                      {expandedProduct.variantDetails && (
                        <p className="text-xs text-gray-600 truncate">
                          {expandedProduct.variantDetails}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Kapcdam Marketplace
                      </p>
                      <div className="flex items-center">
                        <NumericFormat
                          thousandSeparator={true}
                          displayType="text"
                          prefix="UGX "
                          value={Math.max(
                            0,
                            parseInt(expandedProduct.price) || 0
                          )}
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
                        disabled={cartItem.quantity <= 1}
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
                        disabled={cartItem.quantity >= 99}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveItem(expandedProduct)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Render Courses */}
            <AnimatePresence mode="popLayout">
              {cartDisplayData?.courses.map((course) => {
                const cartItem = cartData.find(
                  (item) =>
                    item.type === "course" && item.courseId === course._id
                );
                if (!cartItem) return null;

                // Enhanced key for courses
                const courseKey = `course-${course._id}-${cartItem.quantity}`;

                return (
                  <motion.div
                    key={courseKey}
                    layout
                    initial={{ opacity: 1, x: 0, scale: 1 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      x: -100,
                      scale: 0.8,
                      transition: { duration: 0.3, ease: "easeInOut" },
                    }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg"
                  >
                    <Image
                      src={urlFor(course.defaultImage)
                        .width(80)
                        .height(80)
                        .url()}
                      alt={course.title}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {course.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Kapcdam Course • Qty: 1 (fixed)
                      </p>
                      <div className="flex items-center">
                        <NumericFormat
                          thousandSeparator={true}
                          displayType="text"
                          prefix="UGX "
                          value={Math.max(0, parseInt(course.price) || 0)}
                          className="text-sm font-semibold"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Disabled quantity controls for courses */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={true}
                        className="h-8 w-8 p-0 opacity-50 cursor-not-allowed"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center text-gray-500">
                        1
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={true}
                        className="h-8 w-8 p-0 opacity-50 cursor-not-allowed"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const cartId = userCart?._id;
                          if (isSignedIn && cartId) {
                            console.log(
                              "cart-sheet-handleRemoveItem-userCart",
                              userCart
                            );
                            // Server cart removal for courses
                            const itemIndex = cartData.findIndex(
                              (item) =>
                                item.type === "course" &&
                                item.courseId === course._id
                            );
                            if (itemIndex !== -1) {
                              updateServerCartMutation.mutate({
                                cartId,
                                itemIndex,
                                quantity: 0,
                              });
                            }
                          } else {
                            // Local cart removal for courses
                            removeLocalItem(
                              "", // productId not needed for courses
                              course._id,
                              undefined
                            );
                          }
                        }}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {currentTotalItems > 0 && (
        <div
          className={cn(
            isMobile
              ? "border-t p-4 space-y-4 fixed bottom-0 left-0 right-0 bg-white"
              : "border-t p-4 space-y-4"
          )}
        >
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total:</span>
            <NumericFormat
              thousandSeparator={true}
              displayType="text"
              prefix="UGX "
              value={Math.max(0, totalPrice)}
              className="text-lg font-bold"
            />
          </div>
          <Button
            className="w-full bg-[#C5F82A] text-black hover:bg-[#B4E729]"
            onClick={handleProceedToCheckout}
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
        <DrawerContent className="h-[90vh] pb-52">
          <DrawerHeader>
            <DrawerTitle>Shopping Cart ({currentTotalItems} items)</DrawerTitle>
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
          <SheetTitle>Shopping Cart ({currentTotalItems} items)</SheetTitle>
        </SheetHeader>
        <CartContent />
      </SheetContent>
    </Sheet>
  );
}
