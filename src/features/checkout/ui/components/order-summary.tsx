"use client";

import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { NumericFormat } from "react-number-format";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { CartType } from "@/features/cart/schema";
import { ExpandedProduct, expandCartVariants } from "@/features/cart/helpers";
type Props = {
  userCart: Omit<CartType, "addedAt" | "createdAt"> | null;
  shippingCost?: number;
  onPrimaryAction?: () => void;
  primaryActionText?: string;
  primaryActionDisabled?: boolean;
  className?: string;
};

export function OrderSummary({
  userCart,
  shippingCost = 0,
  onPrimaryAction,
  primaryActionText = "Place Order",
  primaryActionDisabled = false,
  className = "",
}: Props) {
  const {
    items: localItems,
    updateQuantity: updateLocalQuantity,
    removeItem: removeLocalItem,
  } = useLocalCartStore();

  const { isSignedIn } = useUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Simplify cart data flow - use single source of truth with memoization
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
        await queryClient.cancelQueries(trpc.cart.getUserCart.queryOptions());
        await queryClient.cancelQueries({
          queryKey: ["cart", "getDisplayData"],
        });

        const previousCart = queryClient.getQueryData(
          trpc.cart.getUserCart.queryOptions().queryKey
        );

        queryClient.setQueryData(
          trpc.cart.getUserCart.queryOptions().queryKey,
          (old: any) => {
            if (!old) return old;

            const updatedItems = [...old.cartItems];
            if (variables.quantity === 0) {
              updatedItems.splice(variables.itemIndex, 1);
            } else {
              updatedItems[variables.itemIndex] = {
                ...updatedItems[variables.itemIndex],
                quantity: variables.quantity,
              };
            }

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
        if (context?.previousCart) {
          queryClient.setQueryData(
            trpc.cart.getUserCart.queryOptions().queryKey,
            context.previousCart
          );
        }
        toast.error(`Failed to update cart: ${error.message}`);
      },
      onSuccess: () => {
        queryClient.refetchQueries(trpc.cart.getUserCart.queryOptions());
        queryClient.refetchQueries({
          queryKey: ["cart", "getDisplayData"],
        });
        toast.success("Cart updated successfully!");
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
    return cartData.reduce((acc, cartItem) => {
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

        const price = expandedProduct ? parseInt(expandedProduct.price) : 0;
        return acc + price * cartItem.quantity;
      }

      if (cartItem.type === "course") {
        const course = cartDisplayData?.courses.find(
          (c) => c._id === cartItem.courseId
        );
        const price = course ? parseInt(course.price) : 0;
        return acc + price * cartItem.quantity;
      }

      return acc;
    }, 0);
  }, [cartData, expandedProducts, cartDisplayData?.courses]);

  // Handle quantity updates
  const handleUpdateQuantity = (
    expandedProduct: ExpandedProduct,
    newQuantity: number
  ) => {
    if (isSignedIn && userCart?._id) {
      const itemIndex = findCartItemIndex(expandedProduct);
      if (itemIndex === -1) return;

      updateServerCartMutation.mutate({
        cartId: userCart._id,
        itemIndex,
        quantity: newQuantity,
      });
    } else {
      updateLocalQuantity(
        expandedProduct.originalProductId,
        "",
        expandedProduct.VariantSku,
        newQuantity
      );
    }
  };

  // Handle item removal
  const handleRemoveItem = (expandedProduct: ExpandedProduct) => {
    if (isSignedIn && userCart?._id) {
      const itemIndex = findCartItemIndex(expandedProduct);
      if (itemIndex === -1) return;

      updateServerCartMutation.mutate({
        cartId: userCart._id,
        itemIndex,
        quantity: 0,
      });
    } else {
      removeLocalItem(
        expandedProduct.originalProductId,
        "",
        expandedProduct.VariantSku
      );
    }
  };

  // Calculate total items count from cart data
  const currentTotalItems = useMemo(() => {
    return cartData.reduce((total, item) => total + item.quantity, 0);
  }, [cartData]);

  // Calculate totals
  const subtotal = totalPrice;
  const tax = 0; // No tax for now
  const discount = 0; // No discount for now
  const finalTotal = subtotal + shippingCost + tax - discount;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Order Summary ({currentTotalItems} items)
        </h2>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {currentTotalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500">Add some products to get started!</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Render Products */}
              {expandedProducts.map((expandedProduct) => {
                const cartItem = findCartItemForProduct(expandedProduct);
                if (!cartItem) return null;

                const itemKey = `${expandedProduct._id}-${cartItem.quantity}-${expandedProduct.VariantSku || "no-variant"}`;

                return (
                  <div
                    key={itemKey}
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
                      <p className="text-sm text-gray-500">
                        Kapcdam Marketplace
                      </p>
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

              {/* Render Courses */}
              {cartDisplayData?.courses.map((course) => {
                const cartItem = cartData.find(
                  (item) =>
                    item.type === "course" && item.courseId === course._id
                );
                if (!cartItem) return null;

                const courseKey = `course-${course._id}-${cartItem.quantity}`;

                return (
                  <div
                    key={courseKey}
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
                      <p className="text-sm text-gray-500">Kapcdam Course</p>
                      <div className="flex items-center">
                        <NumericFormat
                          thousandSeparator={true}
                          displayType="text"
                          prefix="UGX "
                          value={course.price}
                          className="text-sm font-semibold"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (isSignedIn && userCart?._id) {
                            const itemIndex = cartData.findIndex(
                              (item) =>
                                item.type === "course" &&
                                item.courseId === course._id
                            );
                            if (itemIndex !== -1) {
                              updateServerCartMutation.mutate({
                                cartId: userCart._id,
                                itemIndex,
                                quantity: cartItem.quantity - 1,
                              });
                            }
                          } else {
                            updateLocalQuantity(
                              "",
                              course._id,
                              undefined,
                              cartItem.quantity - 1
                            );
                          }
                        }}
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
                        onClick={() => {
                          if (isSignedIn && userCart?._id) {
                            const itemIndex = cartData.findIndex(
                              (item) =>
                                item.type === "course" &&
                                item.courseId === course._id
                            );
                            if (itemIndex !== -1) {
                              updateServerCartMutation.mutate({
                                cartId: userCart._id,
                                itemIndex,
                                quantity: cartItem.quantity + 1,
                              });
                            }
                          } else {
                            updateLocalQuantity(
                              "",
                              course._id,
                              undefined,
                              cartItem.quantity + 1
                            );
                          }
                        }}
                        disabled={updateServerCartMutation.isPending}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (isSignedIn && userCart?._id) {
                            const itemIndex = cartData.findIndex(
                              (item) =>
                                item.type === "course" &&
                                item.courseId === course._id
                            );
                            if (itemIndex !== -1) {
                              updateServerCartMutation.mutate({
                                cartId: userCart._id,
                                itemIndex,
                                quantity: 0,
                              });
                            }
                          } else {
                            removeLocalItem("", course._id, undefined);
                          }
                        }}
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

            {/* Totals Section */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <NumericFormat
                  thousandSeparator={true}
                  displayType="text"
                  prefix="UGX "
                  value={subtotal}
                  className="font-medium"
                />
              </div>

              {shippingCost > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <NumericFormat
                    thousandSeparator={true}
                    displayType="text"
                    prefix="UGX "
                    value={shippingCost}
                    className="font-medium"
                  />
                </div>
              )}

              {tax > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <NumericFormat
                    thousandSeparator={true}
                    displayType="text"
                    prefix="UGX "
                    value={tax}
                    className="font-medium"
                  />
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <NumericFormat
                    thousandSeparator={true}
                    displayType="text"
                    prefix="-UGX "
                    value={discount}
                    className="font-medium text-green-600"
                  />
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <NumericFormat
                    thousandSeparator={true}
                    displayType="text"
                    prefix="UGX "
                    value={finalTotal}
                    className="text-lg font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            {onPrimaryAction && (
              <div className="pt-4">
                <Button
                  className="w-full bg-[#C5F82A] text-black hover:bg-[#B4E729]"
                  disabled={
                    primaryActionDisabled || updateServerCartMutation.isPending
                  }
                  onClick={onPrimaryAction}
                >
                  {primaryActionText}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
