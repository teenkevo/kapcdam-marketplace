"use client";

import { useState } from "react";
import { Plus, ShoppingCart, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductVariant } from "../../schemas";
import { AddToCartButton } from "@/features/cart/ui/components/add-to-cart-btn";
import { useCartSyncContext } from "@/features/cart/hooks/cart-sync-context";
import { useIsAdmin } from "@/features/auth/lib/use-is-admin";
import ResponsiveDialog from "@/components/shared/responsive-dialog";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { CartItemType } from "@/features/cart/schema";
import { urlFor } from "@/sanity/lib/image";
import { SanityAsset } from "@sanity/image-url/lib/types/types";
import { cn } from "@/lib/utils";
import { StockStatus } from "./stock-status";

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
  const [preferredSku, setPreferredSku] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { isSyncing } = useCartSyncContext();
  const { isAdmin } = useIsAdmin();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const selectedVariant =
    productVariants.find((v) => v.sku === preferredSku && (v.stock ?? 0) > 0) ??
    pickDefaultVariant(productVariants);

  const currentImages = images || [];
  const currentImage = currentImages[currentImageIndex];

  const price = Number.parseInt(selectedVariant?.price ?? "0");

  const stock = selectedVariant?.stock ?? 0;

  const cartItem: CartItemType | null = productId
    ? {
        type: "product" as const,
        quantity,
        productId,
        selectedVariantSku: selectedVariant?.sku ?? null,
      }
    : null;

  const handleThumbnailHover = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <>
      <Button
        className="bg-[#C5F82A] text-black hover:bg-[#B4E729] w-full"
        disabled={isSyncing || isAdmin}
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
              {stock === 0 && (
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
                className="object-contain aspect-auto block md:hidden"
              />
              <h1 className="text-xl font-medium mb-4">{title}</h1>
            </div>

            <p className="text-2xl font-bold">UGX {price.toLocaleString()}</p>

            <StockStatus stock={stock} />
            <div className="space-y-4 mt-6">
              <Label className="font-semibold">Options</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {productVariants.map((variant) => {
                  const isOutOfStock = (variant.stock ?? 0) <= 0;
                  const isSelected = selectedVariant?.sku === variant.sku;

                  return (
                    <button
                      key={variant.sku}
                      onClick={() =>
                        !isOutOfStock && setPreferredSku(variant.sku)
                      }
                      disabled={isOutOfStock}
                      className={cn(
                        "px-4 py-2 border text-sm transition-colors rounded-sm",
                        isOutOfStock
                          ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                          : isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "hover:bg-muted border-border"
                      )}
                    >
                      <span className="flex flex-col items-center gap-1">
                        {variant.attributes?.length ? (
                          variant.attributes.map((a, i) => (
                            <span key={i} className="text-xs">
                              {a.attributeName}: {a.value}
                            </span>
                          ))
                        ) : (
                          <span>SKU: {variant.sku}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex w-full mt-8">
              {" "}
              {cartItem && (
                <AddToCartButton
                  product={cartItem}
                  quantity={quantity}
                  availableStock={stock}
                />
              )}{" "}
            </div>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}

function pickDefaultVariant(variants: ProductVariant[]) {
  if (!variants?.length) return undefined;

  // Prefer an explicit default with stock
  const flaggedInStock = variants.find(
    (v) => v.isDefault && (v.stock ?? 0) > 0
  );
  if (flaggedInStock) return flaggedInStock;

  // Else first in-stock
  const firstInStock = variants.find((v) => (v.stock ?? 0) > 0);
  if (firstInStock) return firstInStock;

  // Else explicit default (even if 0), else first
  return variants.find((v) => v.isDefault) ?? variants[0];
}
