"use client";

import { NumericFormat } from "react-number-format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

import { Check, Heart, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { urlFor } from "@/sanity/lib/image";
import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { ProductListItem } from "@/modules/products/schemas";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type ProductCardProps = {
  product: ProductListItem;
};

export function ProductCard({ product }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const user = useUser();
  const { addLocalCartItem } = useLocalCartStore();

  const trpc = useTRPC();
  const queryClient = useQueryClient();
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

  if (!product.totalStock || product.totalStock === 0) {
    return null;
  }

  const defaultVariant = product.hasVariants
    ? product.variantOptions.find((v) => v.isDefault) ||
      product.variantOptions[0]
    : null;

  const availableStock = product.hasVariants
    ? defaultVariant?.stock || 0
    : product.totalStock;

  if (availableStock === 0) {
    return null;
  }

  const displayPrice =
    product.hasVariants && defaultVariant
      ? defaultVariant.price
      : product.price;

  const additionalVariantCount = product.hasVariants
    ? Math.max(0, product.variantOptions.length - 1)
    : 0;

  const handleAddToCart = async () => {
    if (!availableStock || availableStock === 0) return;

    setIsAdding(true);

    if (user.isSignedIn) {
      try {
        addItemToCart.mutate({
          type: "product",
          clerkUserId: user.user?.id,
          productId: product._id,
          selectedVariantSku: product.hasVariants
            ? defaultVariant?.sku
            : undefined,
          quantity: 1,
        });
        toast.success(`${product.title} added to cart!`);
      } catch (error) {
        toast.error("Failed to add item to cart");
        console.error("Add to cart error:", error);
      } finally {
        setTimeout(() => {
          setIsAdding(false);
        }, 500);
      }
    } else {
      addLocalCartItem({
        type: "product",
        productId: product._id,
        selectedVariantSku: defaultVariant?.sku,
        quantity: 1,
        displayData: {
          image: product.defaultImage,
          price: parseInt(displayPrice),
          title: product.title,
        },
      });
    }
  };

  const imageSrc = product.defaultImage
    ? urlFor(product.defaultImage).width(300).height(300).url()
    : `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(
        product.title || ""
      )}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <Image
            src={imageSrc}
            alt={product.title || "Product image"}
            width={300}
            height={300}
            className="object-cover w-full h-full p-4"
          />

          {/* Low stock indicator */}
          {availableStock <= 5 && availableStock > 0 && (
            <div className="absolute top-2 left-2">
              <Badge variant="destructive" className="text-xs">
                Only {availableStock} left
              </Badge>
            </div>
          )}

          {/* Discount indicator */}
          {product.hasDiscount && product.discountInfo && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-red-500 text-white text-xs">
                -{product.discountInfo.value}% OFF
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 flex justify-between items-center">
              <h3 className="font-semibold text-sm leading-tight min-h-[2.5rem] line-clamp-2">
                {product.title}
              </h3>
              {product.category?.name && (
                <Badge variant="secondary" className="mt-1 text-xs h-fit">
                  {product.category.name}
                </Badge>
              )}
            </div>
          </div>

          <div>
            {additionalVariantCount > 0 && (
              <div className="text-xs text-muted-foreground">
                +{additionalVariantCount} more option
                {additionalVariantCount > 1 ? "s" : ""}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.averageRating || 0)
                    ? "fill-[#DE7920] text-[#DE7920]"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            ))}
            <span className="text-sm text-gray-500">
              ({product.totalReviews || 0})
            </span>
            {product.averageRating && (
              <span className="text-sm font-medium ml-1">
                {product.averageRating.toFixed(1)}
              </span>
            )}
          </div>

          <hr className="w-full border-t border-gray-200" />

          <div className="flex items-center justify-between">
            <div className="text-gray-500 text-sm">Price</div>
            <div className="text-right">
              <NumericFormat
                thousandSeparator={true}
                displayType="text"
                prefix="UGX "
                value={displayPrice}
                className="font-semibold text-lg"
              />

              {product.hasDiscount && product.discountInfo && (
                <div className="text-xs text-red-500">
                  Save {product.discountInfo.value}%
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {availableStock > 10 ? "In stock" : `${availableStock} available`}
            </span>
            {product.hasVariants && <span>Default variant</span>}
          </div>

          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" className="shrink-0">
              <Heart className="w-4 h-4" />
            </Button>
            <Button
              className="bg-[#C5F82A] text-black hover:bg-[#B4E729] flex-1"
              onClick={handleAddToCart}
              disabled={!availableStock || isAdding}
            >
              {isAdding ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
