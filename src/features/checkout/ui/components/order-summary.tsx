"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
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
import { ExpandedProduct, expandCartVariants } from "@/features/cart/helpers";
type Props = {
  userCart: Omit<CartType, "addedAt" | "createdAt"> | null;
  shippingCost?: number;
  onPrimaryAction?: () => void;
  primaryActionText?: string;
  primaryActionDisabled?: boolean;
  className?: string;
  onCouponChange?: (
    coupon: {
      code: string;
      discountAmount: number;
      originalPercentage: number;
    } | null
  ) => void;
};

export function OrderSummary({
  userCart,
  shippingCost = 0,
  onPrimaryAction,
  primaryActionText = "Place Order",
  primaryActionDisabled = false,
  className = "",
  onCouponChange,
}: Props) {
  const {
    items: localItems,
    updateQuantity: updateLocalQuantity,
    removeItem: removeLocalItem,
  } = useLocalCartStore();

  const { isSignedIn } = useUser();
  const { userId } = useAuth();
  const trpcClient = useTRPC();
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
    trpcClient.cart.getDisplayData.queryOptions({
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
    trpcClient.cart.updateCartItem.mutationOptions({
      onMutate: async (variables) => {
        setIsUpdating(true);
        // Cancel outgoing queries to prevent race conditions
        await queryClient.cancelQueries(
          trpcClient.cart.getUserCart.queryOptions()
        );
        await queryClient.cancelQueries(
          trpcClient.cart.getDisplayData.queryOptions({
            productIds,
            courseIds,
            selectedSKUs,
          })
        );
        // Also cancel getCartById queries used in checkout
        if (userCart?._id) {
          await queryClient.cancelQueries(
            trpcClient.cart.getCartById.queryOptions({ cartId: userCart._id })
          );
        }

        const previousCart = queryClient.getQueryData(
          trpcClient.cart.getUserCart.queryOptions().queryKey
        );

        // Optimistically update getUserCart cache
        queryClient.setQueryData(
          trpcClient.cart.getUserCart.queryOptions().queryKey,
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

        // Also optimistically update getCartById cache if it exists
        if (userCart?._id) {
          queryClient.setQueryData(
            trpcClient.cart.getCartById.queryOptions({ cartId: userCart._id })
              .queryKey,
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
        }

        return { previousCart };
      },
      onError: (error, variables, context) => {
        setIsUpdating(false);
        // Rollback optimistic updates on error
        if (context?.previousCart) {
          queryClient.setQueryData(
            trpcClient.cart.getUserCart.queryOptions().queryKey,
            context.previousCart
          );
        }
        toast.error(`Failed to update cart: ${error.message}`);
      },
      onSuccess: () => {
        setIsUpdating(false);
        // Refetch all relevant cart queries to ensure consistency
        queryClient.refetchQueries(trpcClient.cart.getUserCart.queryOptions());
        queryClient.refetchQueries(
          trpcClient.cart.getDisplayData.queryOptions({
            productIds,
            courseIds,
            selectedSKUs,
          })
        );
        // Refetch getCartById query used in checkout
        if (userCart?._id) {
          queryClient.refetchQueries(
            trpcClient.cart.getCartById.queryOptions({ cartId: userCart._id })
          );
        }
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

  // Helper function to calculate product/course discount from existing discount info
  const calculateItemDiscount = (
    originalPrice: number,
    discountInfo?: { value: number; isActive: boolean }
  ) => {
    if (!discountInfo?.isActive || !discountInfo?.value) return 0;
    // Product/course discounts are percentage-based
    return Math.round((originalPrice * discountInfo.value) / 100);
  };

  // Calculate totals with item-level discounts from product/course discount info
  const { subtotalBeforeDiscount, itemDiscountTotal, finalSubtotal } =
    useMemo(() => {
      let subtotalBeforeDiscount = 0;
      let itemDiscountTotal = 0;

      cartData.forEach((cartItem) => {
        let itemPrice = 0;
        let discountInfo = null;

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
          itemPrice = expandedProduct ? parseInt(expandedProduct.price) : 0;

          // Get discount info from the product data
          const productData = cartDisplayData?.products.find(
            (p) => p._id === cartItem.productId
          );
          discountInfo = productData?.discountInfo;
        }

        if (cartItem.type === "course") {
          const course = cartDisplayData?.courses.find(
            (c) => c._id === cartItem.courseId
          );
          itemPrice = course ? parseInt(course.price) : 0;
          discountInfo = course?.discountInfo;
        }

        const lineTotal = itemPrice * cartItem.quantity;
        const lineDiscount = calculateItemDiscount(
          lineTotal,
          discountInfo || undefined
        );

        subtotalBeforeDiscount += lineTotal;
        itemDiscountTotal += lineDiscount;
      });

      const finalSubtotal = subtotalBeforeDiscount - itemDiscountTotal;

      return { subtotalBeforeDiscount, itemDiscountTotal, finalSubtotal };
    }, [
      cartData,
      expandedProducts,
      cartDisplayData?.courses,
      cartDisplayData?.products,
    ]);

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

  // State for coupon handling - removed automatic persistence
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: {
      percentage: number;
      amount: number;
      description?: string | null;
    };
    minimumOrderAmount?: number;
  } | null>(null);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Simple setter without persistence
  const setAppliedCouponState = useCallback((coupon: typeof appliedCoupon) => {
    setAppliedCoupon(coupon);
  }, []);

  const validateCouponMutation = useMutation(
    trpcClient.coupons.validateCoupon.mutationOptions({
      onMutate: () => {
        setIsUpdating(true);
      },
      onSuccess: (result) => {
        setIsUpdating(false);
        if (result.valid && result.discount) {
          const couponData = {
            code: couponCode,
            discount: result.discount,
            minimumOrderAmount: result.discount.minimumOrderAmount,
          };
          setAppliedCouponState(couponData);
          setCouponCode("");
          setShowCouponInput(false);
          setCouponError(null);

          // Notify parent component about the applied coupon with dynamic amount
          const dynamicDiscountAmount = Math.round((finalSubtotal * couponData.discount.percentage) / 100);
          onCouponChange?.({
            code: couponData.code,
            discountAmount: dynamicDiscountAmount,
            originalPercentage: couponData.discount.percentage,
          });

          toast.success(
            `Coupon "${result.discount.code}" applied successfully!`
          );
        } else {
          setCouponError(result.error || "Invalid coupon code");
        }
      },
      onError: (error) => {
        setIsUpdating(false);
        setCouponError(error.message);
      },
    })
  );

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponError(null);
    validateCouponMutation.mutate({
      code: couponCode.trim(),
      orderTotal: finalSubtotal,
      userId: userId || undefined,
      cartItems: cartData.map((item) => ({
        type: item.type,
        productId: item.productId || undefined,
        courseId: item.courseId || undefined,
        quantity: item.quantity,
      })),
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponState(null);
    setCouponError(null);

    // Notify parent component that coupon was removed
    onCouponChange?.(null);

    toast.success("Coupon removed");
  };

  // Calculate final totals with dynamic coupon calculation
  const tax = 0; // No tax for now
  const couponDiscount = appliedCoupon 
    ? Math.round((finalSubtotal * appliedCoupon.discount.percentage) / 100)
    : 0;
  const finalTotal = finalSubtotal + shippingCost + tax - couponDiscount;

  // Use ref to track the last notified discount amount to prevent unnecessary updates
  const lastNotifiedDiscountRef = useRef<number>(0);
  const onCouponChangeRef = useRef(onCouponChange);
  
  // Update ref when onCouponChange changes
  useEffect(() => {
    onCouponChangeRef.current = onCouponChange;
  }, [onCouponChange]);

  // Effect to handle coupon recalculation and validation when cart changes
  useEffect(() => {
    if (appliedCoupon) {
      // Check if minimum order amount is still met
      if (appliedCoupon.minimumOrderAmount && finalSubtotal < appliedCoupon.minimumOrderAmount) {
        // Remove coupon if minimum order amount is no longer met
        setAppliedCouponState(null);
        setCouponError(null);
        onCouponChangeRef.current?.(null);
        lastNotifiedDiscountRef.current = 0;
        toast.error(`Coupon removed: Minimum order amount of UGX ${appliedCoupon.minimumOrderAmount.toLocaleString()} required`);
        return;
      }

      // If cart is empty, remove coupon
      if (finalSubtotal === 0) {
        setAppliedCouponState(null);
        setCouponError(null);
        onCouponChangeRef.current?.(null);
        lastNotifiedDiscountRef.current = 0;
        return;
      }

      // Calculate new discount amount
      const dynamicDiscountAmount = Math.round((finalSubtotal * appliedCoupon.discount.percentage) / 100);
      
      // Only notify parent if the discount amount has actually changed
      if (onCouponChangeRef.current && dynamicDiscountAmount !== lastNotifiedDiscountRef.current) {
        lastNotifiedDiscountRef.current = dynamicDiscountAmount;
        onCouponChangeRef.current({
          code: appliedCoupon.code,
          discountAmount: dynamicDiscountAmount,
          originalPercentage: appliedCoupon.discount.percentage,
        });
      }
    } else {
      // Reset ref when no coupon is applied
      lastNotifiedDiscountRef.current = 0;
    }
  }, [finalSubtotal, appliedCoupon?.code, appliedCoupon?.discount.percentage, appliedCoupon?.minimumOrderAmount]);

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-6 relative ${className}`}
    >
      {/* Loading Overlay */}
      <AnimatePresence>
        {isUpdating && (
          <motion.div
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
              <span className="text-sm text-gray-600">Updating...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <AnimatePresence mode="popLayout">
                {expandedProducts.map((expandedProduct) => {
                  const cartItem = findCartItemForProduct(expandedProduct);
                  if (!cartItem) return null;

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
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {expandedProduct.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Kapcdam Marketplace
                        </p>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const productData = cartDisplayData?.products.find(
                              (p) => p._id === cartItem.productId
                            );
                            const hasDiscount =
                              productData?.hasDiscount &&
                              productData?.discountInfo?.isActive;

                            if (hasDiscount && productData?.discountInfo) {
                              const originalPrice = parseInt(
                                expandedProduct.price
                              );
                              const discountAmount = calculateItemDiscount(
                                originalPrice,
                                productData.discountInfo
                              );
                              const discountedPrice =
                                originalPrice - discountAmount;

                              return (
                                <>
                                  {/* Original price crossed out */}
                                  <NumericFormat
                                    thousandSeparator={true}
                                    displayType="text"
                                    prefix="UGX "
                                    value={expandedProduct.price}
                                    className="text-xs text-gray-400 line-through"
                                  />
                                  {/* Discounted price */}
                                  <NumericFormat
                                    thousandSeparator={true}
                                    displayType="text"
                                    prefix="UGX "
                                    value={discountedPrice}
                                    className="text-sm font-semibold text-green-600"
                                  />
                                  {/* Discount badge */}
                                  <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                    -{productData.discountInfo.value}%
                                  </span>
                                </>
                              );
                            } else {
                              return (
                                <NumericFormat
                                  thousandSeparator={true}
                                  displayType="text"
                                  prefix="UGX "
                                  value={expandedProduct.price}
                                  className="text-sm font-semibold"
                                />
                              );
                            }
                          })()}
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
                            if (isSignedIn && userCart?._id) {
                              // Server cart removal for courses
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
                              // Local cart removal for courses
                              removeLocalItem(
                                "", // productId not needed for courses
                                course._id,
                                undefined
                              );
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
              </AnimatePresence>
            </div>

            {/* Totals Section */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <NumericFormat
                  thousandSeparator={true}
                  displayType="text"
                  prefix="UGX "
                  value={subtotalBeforeDiscount}
                  className="font-medium"
                />
              </div>

              {/* Item-level discounts */}
              {itemDiscountTotal > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Item Discounts:</span>
                  <NumericFormat
                    thousandSeparator={true}
                    displayType="text"
                    prefix="UGX "
                    value={-Math.abs(itemDiscountTotal)}
                    allowNegative={true}
                    className="font-medium text-green-600"
                  />
                </div>
              )}

              {/* Coupon Section */}
              {!appliedCoupon && !showCouponInput && (
                <div className="flex justify-between items-center text-sm">
                  <Button
                    variant="link"
                    onClick={() => setShowCouponInput(true)}
                    className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal text-sm"
                  >
                    I have a coupon
                  </Button>
                </div>
              )}

              {/* Coupon Input */}
              <AnimatePresence>
                {showCouponInput && !appliedCoupon && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="space-y-2"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleApplyCoupon()
                        }
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={
                          validateCouponMutation.isPending || !couponCode.trim()
                        }
                        className="px-4 py-2 bg-lime-500 text-white text-sm rounded-md hover:bg-lime-600 disabled:opacity-50"
                      >
                        {validateCouponMutation.isPending
                          ? "Applying..."
                          : "Apply"}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-red-600 text-xs">{couponError}</p>
                    )}
                    <Button
                      variant="link"
                      onClick={() => {
                        setShowCouponInput(false);
                        setCouponCode("");
                        setCouponError(null);
                      }}
                      className="text-gray-500 hover:text-gray-700 p-0 h-auto font-normal text-xs"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Applied Coupon */}
              <AnimatePresence>
                {appliedCoupon && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-600 flex items-center gap-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        {appliedCoupon.code}
                      </span>
                      {`Coupon (-${appliedCoupon.discount.percentage}%):`}
                      <Button
                        variant="link"
                        onClick={handleRemoveCoupon}
                        className="text-red-600 hover:text-red-800 p-0 h-auto font-normal text-xs ml-2"
                      >
                        Remove
                      </Button>
                    </span>
                    <NumericFormat
                      thousandSeparator={true}
                      displayType="text"
                      prefix="UGX "
                      value={-Math.abs(couponDiscount)}
                      allowNegative={true}
                      className="font-medium text-green-600"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

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
