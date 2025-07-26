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
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export function CartSheet() {
  const { userId } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

 
  const {
    items: localItems,
    updateQuantity: updateLocalQuantity,
    removeItem: removeLocalItem,
    itemCount: localItemCount,
    isCartOpen,
    setIsCartOpen,
  } = useLocalCartStore();

 
  const { data: serverCart, refetch: refetchCart } =
    trpc.cart.getUserCart.useQuery(undefined, {
      enabled: !!userId,
      refetchOnWindowFocus: false,
    });

  const updateServerCartMutation = trpc.cart.updateCartItem.useMutation({
    onSuccess: () => {
      refetchCart();
      toast.success("Cart updated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to update cart: ${error.message}`);
    },
  });

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  
  const items = userId ? serverCart?.cartItems || [] : [];
  const itemCount = userId ? serverCart?.itemCount || 0 : localItemCount();
  const totalPrice = userId ? serverCart?.subtotal || 0 : 0; 


  const localCartTotal = localItems.reduce((total: any, item: any) => {
    return total;
  }, 0);

  const handleUpdateQuantity = (
    itemIndex: number,
    newQuantity: number,
    productId?: string,
    courseId?: string,
    variantSku?: string
  ) => {
    if (userId && serverCart) {
   
      updateServerCartMutation.mutate({
        cartId: serverCart._id,
        itemIndex,
        quantity: newQuantity,
      });
    } else {
      
      updateLocalQuantity(
        productId || "",
        courseId || "",
        variantSku,
        newQuantity
      );
    }
  };

  const handleRemoveItem = (
    itemIndex: number,
    productId?: string,
    courseId?: string,
    variantSku?: string
  ) => {
    if (userId && serverCart) {
    
      updateServerCartMutation.mutate({
        cartId: serverCart._id,
        itemIndex,
        quantity: 0,
      });
    } else {
    
      removeLocalItem(productId, courseId, variantSku);
    }
  };

  const getDisplayPrice = (item: any) => {
    if (userId) {
     
      return item.currentPrice;
    } else {
      
      return 0; 
    }
  };

  const getDisplayTitle = (item: any) => {
    if (userId) {
     
      if (item.type === "product" && item.product) {
        if (item.selectedVariant) {
          const variantText = item.selectedVariant.attributes
            .map((attr: any) => attr.value)
            .join(", ");
          return `${item.product.title} - ${variantText}`;
        }
        return item.product.title;
      } else if (item.type === "course" && item.course) {
        return item.course.title;
      }
    } else {
      
      return "Product"; 
    }
    return "Unknown Item";
  };

  const getDisplayImage = (item: any) => {
    if (userId) {
     
      if (item.type === "product" && item.product?.defaultImage) {
        return urlFor(item.product.defaultImage).width(80).height(80).url();
      } else if (item.type === "course" && item.course?.defaultImage) {
        return urlFor(item.course.defaultImage).width(80).height(80).url();
      }
    }

    return `/placeholder.svg?height=80&width=80`;
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
            {items.map((item: any, index: number) => (
              <div
                key={`${item.type}-${item.product?._id || item.course?._id || index}`}
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
                      handleUpdateQuantity(
                        index,
                        item.quantity - 1,
                        item.product?._id || item.productId,
                        item.course?._id || item.courseId,
                        item.selectedVariantSku
                      )
                    }
                    disabled={updateServerCartMutation.isPending}
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
                        item.product?._id || item.productId,
                        item.course?._id || item.courseId,
                        item.selectedVariantSku
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
                    onClick={() =>
                      handleRemoveItem(
                        index,
                        item.product?._id || item.productId,
                        item.course?._id || item.courseId,
                        item.selectedVariantSku
                      )
                    }
                    disabled={updateServerCartMutation.isPending}
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
              value={userId ? totalPrice : localCartTotal}
              className="text-lg font-bold"
            />
          </div>
          <Button className="w-full bg-[#C5F82A] text-black hover:bg-[#B4E729]">
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
