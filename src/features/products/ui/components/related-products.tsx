"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { ProductCard } from "./product-card";

interface RelatedProductsProps {
  productId: string;
  categoryId?: string;
}

export function RelatedProducts({
  productId,
  categoryId,
}: RelatedProductsProps) {
  const trpc = useTRPC();

  const { data: relatedProducts, isLoading } = useQuery(
    trpc.products.getRelatedProducts.queryOptions({
      productId,
      categoryId,
      limit: 4,
    })
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h2 className="text-2xl font-bold mb-8">Related Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 mb-4"></div>
              <div className="h-4 bg-gray-200 mb-2"></div>
              <div className="h-4 bg-gray-200 w-2/3 mb-2"></div>
              <div className="h-6 bg-gray-200 w-1/2"></div>
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
    <div className="max-w-7xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-8">
        {categoryId ? "Related Products" : "You Might Also Like"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
