"use client";

import { ProductCard } from "./product-card";
import { CartBubble } from "@/features/cart/ui/components/cart-bubble";
import { UnifiedItem, UnifiedProductItem } from "../../schemas";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// Type guard function
function isProductItem(item: UnifiedItem): item is UnifiedProductItem {
  return item.itemType === "product";
}

export function ProductList() {
  const trpc = useTRPC();
  const isMobile = useIsMobile();

  const products = useQuery(
    trpc.products.getMany.queryOptions({
      page: 1,
      pageSize: 10,
      type: "products",
    })
  );

  return (
    <>
      <div className="max-w-7xl mx-auto pt-16 pb-0 md:py-16 px-4 sm:px-6 lg:px-8">
        <p className="text-xs text-gray-500">Scroll horizontally to see more</p>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
            New arrivals
          </h1>
          <Link href="/marketplace">
            <Button size="sm" variant="outline">
              <ShoppingBag className="w-4 h-4" />
              Marketplace
            </Button>
          </Link>
        </div>

        {products.isLoading ? (
          // Loading skeleton - horizontal carousel style
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide items-stretch">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-80 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          // Actual product carousel
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide items-stretch">
            {products.data?.items.filter(isProductItem).map((product) => (
              <div key={product._id} className="flex-shrink-0 w-80">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
