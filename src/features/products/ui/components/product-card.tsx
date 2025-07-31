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
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <Link href={`/products/${product.slug.current}`} className="block">
            <Image
              src={imageSrc}
              alt={product.title || "Product image"}
              width={300}
              height={300}
              className="object-cover w-full h-full p-4 transition-transform duration-200 hover:scale-105"
            />
          </Link>

          {/* Out of stock overlay */}
          {availableStock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-white px-4 py-2 rounded-lg">
                <span className="text-black font-semibold">Out of Stock</span>
              </div>
            </div>
          )}

          {/* Low stock indicator - only show if not out of stock */}
          {availableStock <= 5 && availableStock > 0 && (
            <div className="absolute top-2 left-2 z-10 pointer-events-none">
              <Badge variant="destructive" className="text-xs">
                Only {availableStock} left
              </Badge>
            </div>
          )}

          {/* Discount indicator */}
          {product.hasDiscount && product.discountInfo && (
            <div className="absolute top-2 right-2 z-10 pointer-events-none">
              <Badge className="bg-red-500 text-white text-xs">
                -{product.discountInfo.value}% OFF
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div>
            <Link 
              href={`/products/${product.slug.current}`}
              className="block"
              title={product.title} // Tooltip for full title
            >
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 hover:text-primary transition-colors cursor-pointer mb-2">
                {product.title.length > 80 ? `${product.title.substring(0, 120)}...` : product.title}
              </h3>
            </Link>
            {product.category?.name && (
              <Badge variant="secondary" className="text-xs">
                {product.category.name}
              </Badge>
            )}
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
                  addedAt: new Date().toISOString(),
                }}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
