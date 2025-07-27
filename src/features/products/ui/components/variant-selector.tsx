"use client";

import { useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";

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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-[#C5F82A] text-black flex-1">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to cart
        </Button>
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
                    className={`p-3 border rounded transition-colors ${
                      selectedVariant.sku === variant.sku
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
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
