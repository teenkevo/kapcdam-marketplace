"use client";

import { NumericFormat } from "react-number-format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

import { Star } from "lucide-react";

import { urlFor } from "@/sanity/lib/image";
import { ProductListItem } from "@/features/products/schemas";
import { AddToCartButton } from "@/features/cart/ui/components/add-to-cart-btn";
import LikeProductButton from "./like-product-button";
import VariantSelector from "./variant-selector";

type ProductCardProps = {
  product: ProductListItem;
};

export function ProductCard({ product }: ProductCardProps) {

  const defaultVariant = product.hasVariants
    ? product.variantOptions.find((v) => v.isDefault) ||
      product.variantOptions[0]
    : null;

  const availableStock = product.hasVariants
    ? defaultVariant?.stock || 0
    : product.totalStock;

  const displayPrice =
    product.hasVariants && defaultVariant
      ? defaultVariant.price
      : product.price;

  const additionalVariantCount = product.hasVariants
    ? Math.max(0, product.variantOptions.length - 1)
    : 0;

  const imageSrc = product.defaultImage
    ? urlFor(product.defaultImage).width(300).height(300).url()
    : `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(
        product.title || ""
      )}`;

  return (
    <Card className="flex-1 h-full">
      <CardContent className="p-4 flex flex-col justify-between h-full gap-4">
        <div className="relative">
          <Link
            href={`/marketplace/${product.slug.current}`}
            className="block relative overflow-hidden h-56"
          >
            <Image
              src={imageSrc}
              alt={product.title || "Product image"}
              width={300}
              height={200}
              className="object-cover w-full h-full transition-all duration-300 hover:scale-[1.01] hover:brightness-105"
            />
          </Link>

          {/* Discount indicator */}
          {product.hasDiscount && product.discountInfo && (
            <div className="absolute top-2 right-2 z-10 pointer-events-none">
              <Badge className="bg-green-400 text-white text-xs">
                {product.discountInfo.value}% OFF
              </Badge>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 flex-grow">
          <div className="flex flex-col gap-1">
            <Link
              href={`/marketplace/${product.slug.current}`}
              className="block"
              title={product.title}
            >
              <h3 className="font-medium text-base leading-tight line-clamp-2 hover:text-primary transition-colors cursor-pointer ">
                {product.title}
              </h3>
            </Link>

            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.averageRating || 4.2)
                      ? "fill-[#DE7920] text-[#DE7920]"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
              <span className="text-xs text-gray-500">
                ({product.totalReviews || 300})
              </span>
              {product.averageRating && (
                <span className="text-sm font-medium ml-1">
                  {product.averageRating.toFixed(1)}
                </span>
              )}
            </div>
          </div>

       <div className="flex flex-col gap-1">
           <NumericFormat
             thousandSeparator={true}
             displayType="text"
             prefix="UGX "
             value={displayPrice}
             className="font-semibold text-xl"
           />

           {!product.hasVariants ?  (product.totalStock <= 10 &&(
             <div className="text-xs text-red-500">
               Only {product.totalStock} left in stock. Order soon
             </div>
           )):(
             <div className="text-xs text-gray-500">
               Has {product.variantOptions.length} product variations
             </div>
           )}
        </div>

        <div className="flex items-end gap-2 flex-grow">
          <LikeProductButton productId={product._id} />
          {product.hasVariants ? (
            <VariantSelector
              productId={product._id}
              productVariants={product.variantOptions}
              title={product.title}
            />
          ) : (
            <AddToCartButton
              product={{
                type: "product",
                productId: product._id,
                selectedVariantSku: defaultVariant?.sku,
                quantity: 1,
              }}
              availableStock={availableStock}
            />
          )}
        </div>
        </div>
      </CardContent>
    </Card>
  );
}
