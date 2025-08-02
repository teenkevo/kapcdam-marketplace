import React from "react";
import { ProductsHeaderSkeleton } from "../components/products-header-skeleton";
import ProductsGridSkeleton from "../components/products-grid-skeleton";

export default function ProductsViewSkeleton() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <ProductsHeaderSkeleton />

      <div className="mt-8">
        <ProductsGridSkeleton />
      </div>
    </div>
  );
}
