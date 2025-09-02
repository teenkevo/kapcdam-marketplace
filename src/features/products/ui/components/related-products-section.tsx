"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { ProductCard } from "./product-card";

interface RelatedProductsSectionProps {
  productIds: string[];
  title?: string;
  limit?: number;
  className?: string;
}

export function RelatedProductsSection({
  productIds,
  title = "Related Products",
  limit = 4,
  className = "",
}: RelatedProductsSectionProps) {
  const trpc = useTRPC();

  const { data: relatedProducts, isLoading } = useQuery({
    ...trpc.products.getRelatedProducts.queryOptions({
      productIds,
      limit,
    }),
    enabled: productIds.length > 0,
  });

  if (isLoading) {
    return (
      <div className={`max-w-7xl mx-auto py-12 px-4 ${className}`}>
        <h2 className="text-2xl font-bold mb-8">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!relatedProducts || relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className={`max-w-7xl mx-auto py-12 ${className}`}>
      <h2 className="text-2xl font-bold mb-8">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
