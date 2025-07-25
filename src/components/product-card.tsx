"use client";

import { NumericFormat } from "react-number-format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

import { Check, Heart, ShieldCheck, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/features/cart/lib/contexts/cart-context";
import { useState } from "react";
import { toast } from "sonner";
import { Product } from "@root/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import z from "zod";
import { SingleProductSchema } from "@/modules/products/schemas";

type ProductCardProps = {
  product: z.infer<typeof SingleProductSchema>
};

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!product.totalStock || product.totalStock === 0) return;
    setIsAdding(true);
    addToCart(product);
    toast.success(`${product.title} added to cart!`);
    setTimeout(() => {
      setIsAdding(false);
    }, 500);
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
          {(!product.totalStock || product.totalStock === 0) && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{product?.title}</h3>
            </div>
            {product.category?.name && (
              <Badge variant="secondary">{product.category.name}</Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < (product.rating || 0)
                    ? "fill-[#DE7920] text-[#DE7920]"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            ))}
            <span className="text-sm text-gray-500">({product.totalReviews || 0})</span>
          </div>

          <hr className="w-full border-t border-gray-200" />

          <div className="flex items-center justify-between">
            <div className="text-gray-500 text-sm">Product price</div>
            <NumericFormat
              thousandSeparator={true}
              displayType="text"
              prefix="UGX "
              value={product.price}
              className="font-semibold text-2xl"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2 w-full">
              <Button size="icon" variant="outline">
                <Heart className="w-4 h-4" />
              </Button>
              <Button
                className="bg-[#C5F82A] text-black hover:bg-[#B4E729] flex-grow"
                onClick={handleAddToCart}
                disabled={!product.totalStock || isAdding}
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
        </div>
      </CardContent>
    </Card>
  );
}
