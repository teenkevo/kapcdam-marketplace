"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { ProductsGrid } from "../components/products-grid";
import { ProductsHeader } from "../components/products-header";
import { useProductsFilters } from "../hooks/use-products-filters";

export function ProductsView() {
  const trpc = useTRPC();
  const {
    search,
    category,
    minPrice,
    maxPrice,
    page,
    sortBy,
    pageSize,
    setSearch,
    setCategory,
    setPage,
    setSortBy,
    setPageSize,
  } = useProductsFilters();

  // Fetch products with current filters
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery(
    trpc.products.getMany.queryOptions({
      search: search || undefined,
      categoryId: category || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      page,
      pageSize,
      sortBy,
    })
  );

  // Fetch categories for navigation
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery(
    trpc.products.getCategories.queryOptions()
  );


  const isLoading = productsLoading || categoriesLoading;

  if (productsError) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Products</h1>
        <p className="text-gray-600">Something went wrong. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <ProductsHeader
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        resultsCount={productsData?.total || 0}
        isLoading={isLoading}
        categories={categories || []}
        selectedCategory={category}
        onCategoryChange={setCategory}
      />

      <div className="mt-8">
        <ProductsGrid
          products={productsData?.items || []}
          total={productsData?.total || 0}
          currentPage={page}
          pageSize={pageSize}
          hasMore={productsData?.hasMore || false}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}