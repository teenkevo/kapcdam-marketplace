"use client";
import { NumericFormat } from "react-number-format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/types";
import { Check, Heart, ShieldCheck, ShoppingCart, Star } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <img
            src={product.images[0]}
            alt={product.name}
            className="object-cover w-full h-full p-4"
          />
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{product.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {product.seller.name}
                </span>
                {product.seller.verified && (
                  <ShieldCheck className="w-4 h-4 text-black" />
                )}
              </div>
            </div>
            <Badge variant="secondary">{product.category}</Badge>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < product.rating
                    ? "fill-[#DE7920] text-[#DE7920]"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            ))}
            <span className="text-sm text-gray-500">({product.reviews})</span>
          </div>
          <hr className="w-full border-t border-gray-200" />
          <div className="flex items-center justify-between">
            <div className="text-gray-500 text-sm">Product price</div>
            <div className="font-semibold text-2xl"></div>
            <NumericFormat
              thousandSeparator={true}
              displayType="text"
              prefix={"UGX "}
              value={product.price}
              className="font-semibold text-2xl"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2 w-full">
              <Button size="icon" variant="outline">
                <Heart className="w-4 h-4" />
              </Button>
              <Button className="bg-[#C5F82A] text-black hover:bg-[#B4E729] flex-grow">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
