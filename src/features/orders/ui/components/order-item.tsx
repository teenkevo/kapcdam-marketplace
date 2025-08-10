"use client";

import Image from "next/image";
import { AddToCartButton } from "@/features/cart/ui/components/add-to-cart-btn";
import { WriteReviewButton } from "@/features/reviews/ui/components/write-review-button";
import { urlFor } from "@/sanity/lib/image";

type OrderItem = {
  type: "product" | "course";
  name: string;
  quantity: number;
  variantSku?: string | null;
  productId?: string;
  courseId?: string;
  image?: any;
  itemImage?: any;
};

type Props = {
  item: OrderItem;
  canShowItemActions?: boolean;
  isDelivered?: boolean;
};

export function OrderItem({
  item,
  canShowItemActions = false,
  isDelivered = false,
}: Props) {

  return (
    <li className="py-4 md:py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* Thumbnail */}
        <div className="flex items-start gap-3">
          <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md border bg-white">
            <Image
              src={
                item.itemImage
                  ? urlFor(item.itemImage).width(96).height(80).url()
                  : `/placeholder.svg?height=80&width=96&text=${encodeURIComponent(item.name.substring(0, 10))}`
              }
              alt={item.name}
              width={96}
              height={80}
              className="h-full w-full object-contain p-2"
            />
          </div>
        </div>

        {/* Info and actions */}
        <div className="grid flex-1 gap-2">
          <div className="text-gray-900 font-medium leading-6">{item.name}</div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Quantity: {item.quantity}</span>
            {item.variantSku && <span>SKU: {item.variantSku}</span>}
          </div>

          {canShowItemActions && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Buy it again button */}
              {item.productId && (
                <AddToCartButton
                  product={{
                    type: "product",
                    productId: item.productId,
                    selectedVariantSku: item.variantSku,
                    quantity: 1,
                  }}
                  label="Buy it again"
                  appearance="subtle"
                />
              )}
              {item.courseId && (
                <AddToCartButton
                  product={{
                    type: "course",
                    courseId: item.courseId,
                    quantity: 1,
                  }}
                  label="Buy it again"
                  appearance="subtle"
                />
              )}

              {/* Write review button - only for products */}
              {item.type === "product" && item.productId && isDelivered && (
                <WriteReviewButton productId={item.productId} />
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
