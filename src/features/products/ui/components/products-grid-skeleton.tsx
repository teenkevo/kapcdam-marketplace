import React from "react";

export default function ProductsGridSkeleton() {
  return (
    <div className="space-y-6">
      {/* Loading Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-6">
        {[...Array(12)].map((_, i) => (
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
