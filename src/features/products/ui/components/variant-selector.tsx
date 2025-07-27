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
import { useCartSync } from "@/features/cart/hooks/use-cart-sync";

type Props = {
  title: string;
  productVariants: ProductVariant[];
  productId: string;
};

export default function VariantSelector({
  productVariants,
  title,
  productId,
}: Props) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    productVariants[0]
  );
  const [isOpen, setIsOpen] = useState(false);

  const { isInCart } = useLocalCartStore();
  const { isSignedIn } = useUser();
  const trpc = useTRPC();
  const { isSyncing } = useCartSync();

  // Check if any variant is in cart for visual indication
  const cart = useQuery(trpc.cart.getUserCart.queryOptions());

  const hasVariantInCart = isSignedIn
    ? cart.data?.cartItems.some(
        (item) =>
          item.type === "product" &&
          item.productId === productId &&
          productVariants.some((v) => v.sku === item.selectedVariantSku)
      )
    : productVariants.some((variant) =>
        isInCart(productId, undefined, variant.sku)
      );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative flex-1">
          <Button
            className="bg-[#C5F82A] text-black hover:bg-[#B4E729] w-full"
            disabled={isSyncing}
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
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            {productVariants.map(
              (variant) =>
                variant.stock > 0 && (
                  <div
                    key={variant.sku}
                    className={`p-3 border rounded transition-all cursor-pointer ${
                      selectedVariant.sku === variant.sku
                        ? "border-[#C5F82A] bg-[#C5F82A]/10 ring-2 ring-[#C5F82A]/30"
                        : "hover:bg-[#C5F82A]/5 hover:border-[#C5F82A]/50 hover:ring-1 hover:ring-[#C5F82A]/20"
                    }`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          {variant.attributes.map((attribute) => (
                            <div key={attribute.attributeCode}>
                              {attribute.attributeName}: {attribute.value}
                            </div>
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Stock: {variant.stock}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          UGX {Number.parseInt(variant.price).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
            )}
          </div>
          <div className="flex w-full">
            <AddToCartButton
              product={{
                type: "product",
                productId: productId,
                selectedVariantSku: selectedVariant.sku,
                quantity: 1,
                addedAt: new Date(),
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
