"use client";

import { useState } from "react";
import { Plus, ShoppingCart, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ProductVariant } from "../../schemas";
import { AddToCartButton } from "@/features/cart/ui/components/add-to-cart-btn";
import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useCartSyncContext } from "@/features/cart/hooks/cart-sync-context";
import ResponsiveDialog from "@/components/shared/responsive-dialog";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { CartItemType } from "@/features/cart/schema";
import { urlFor } from "@/sanity/lib/image";
import { SanityAsset } from "@sanity/image-url/lib/types/types";

type Props = {
  title: string;
  productVariants: ProductVariant[];
  productId: string;
  images: SanityAsset[];
};

export default function VariantSelector({
  productVariants,
  title,
  productId,
  images,
}: Props) {
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [isOpen, setIsOpen] = useState(false);
  const { isSyncing } = useCartSyncContext();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const currentImages = images || [];
  const currentImage = currentImages[currentImageIndex];

  const getCurrentPrice = () => {
    if (!productId) return 0;

    const selectedVariant = selectedVariants.variant
      ? productVariants.find((v) => v.sku === selectedVariants.variant)
      : productVariants.find((v) => v.isDefault) || productVariants[0];
    return Number.parseInt(selectedVariant?.price || "0");
  };

  const getCurrentStock = () => {
    if (!productId) return 0;

    const selectedVariant = selectedVariants.variant
      ? productVariants.find((v) => v.sku === selectedVariants.variant)
      : productVariants.find((v) => v.isDefault) || productVariants[0];
    return selectedVariant?.stock || 0;
  };

  const handleVariantChange = (variantSku: string) => {
    setSelectedVariants({ variant: variantSku });
  };

  const cartItem: CartItemType | null = productId
    ? {
        type: "product" as const,
        quantity: quantity,
        productId: productId,
        selectedVariantSku: selectedVariants.variant || null,
      }
    : null;

  const handleThumbnailHover = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <>
      <Button
        className="bg-[#C5F82A] text-black hover:bg-[#B4E729] w-full"
        disabled={isSyncing}
        onClick={() => setIsOpen(true)}
      >
        {isSyncing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to cart
          </>
        )}
      </Button>
      <ResponsiveDialog
        title={title}
        open={isOpen}
        onOpenChange={() => setIsOpen(false)}
      >
        <div className="flex flex-col md:flex-row items-start gap-6 w-fit">
          <div className="md:flex flex-shrink-0 gap-4 hidden">
            {currentImages.length > 1 && (
              <div className=" flex-shrink-0 flex flex-col gap-2 overflow-y-auto pb-2">
                {currentImages.slice(0, 6).map((image, i) => (
                  <div
                    key={i}
                    className={`flex-shrink-0 w-10 h-10 relative border-2 transition-colors cursor-pointer ${
                      i === currentImageIndex
                        ? "border-primary"
                        : "border-transparent hover:border-primary"
                    }`}
                    onMouseEnter={() => handleThumbnailHover(i)}
                  >
                    <Image
                      src={urlFor(image).url() || "/placeholder.svg"}
                      alt={`Product view ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className=" relative flex-shrink-0">
              <Image
                src={urlFor(currentImage).url() || "/placeholder.svg"}
                alt={title}
                width={200}
                height={200}
                className="object-contain aspect-auto"
              />
              {getCurrentStock() === 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold">Out of Stock</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className={"flex flex-row-reverse gap-4"}>
              <Image
                src={urlFor(currentImage).url() || "/placeholder.svg"}
                alt={title}
                width={100}
                height={100}
                className="object-contain aspect-auto"
              />
               <h1 className="text-xl font-medium mb-4">{title}</h1>
            </div>
           

            <p className="text-2xl font-bold">
              UGX {getCurrentPrice().toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {getCurrentStock() > 0
                ? `${getCurrentStock()} in stock`
                : "Out of stock"}
            </p>
            <div>
              {productVariants &&
                productVariants &&
                productVariants.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label className="font-semibold">Options</Label>
                      <div className="flex flex-wrap gap-2">
                        {productVariants.map((variant) => {
                          const isSelected =
                            selectedVariants.variant === variant.sku;
                          const isOutOfStock = (variant.stock || 0) === 0;
                          return (
                            <button
                              key={variant.sku}
                              onClick={() =>
                                !isOutOfStock &&
                                handleVariantChange(variant.sku)
                              }
                              disabled={isOutOfStock}
                              className={`px-4 py-2 border text-sm transition-colors ${
                                isOutOfStock
                                  ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                                  : isSelected
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "hover:bg-muted border-border"
                              }`}
                            >
                              <span className="flex flex-col items-center gap-1">
                                {variant.attributes?.map((attr, i) => (
                                  <span key={i} className="text-xs">
                                    {attr.attributeName}: {attr.value}
                                  </span>
                                )) || <span>SKU: {variant.sku}</span>}
                                {isOutOfStock && (
                                  <span className="text-xs">
                                    (Out of stock)
                                  </span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              <div className="flex w-full mt-8">
                {cartItem && (
                  <AddToCartButton
                    product={cartItem}
                    quantity={quantity}
                    availableStock={getCurrentStock()}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </ResponsiveDialog>
    </>

    // <Dialog open={isOpen} onOpenChange={setIsOpen}>
    //   <DialogTrigger asChild>
    //     <div className="relative flex-1">
    //
    //     </div>
    //   </DialogTrigger>
    //   <DialogContent className="max-w-md">
    //     <DialogHeader>
    //       <DialogTitle>{title}</DialogTitle>
    //     </DialogHeader>

    //   </DialogContent>
    // </Dialog>
  );
}
