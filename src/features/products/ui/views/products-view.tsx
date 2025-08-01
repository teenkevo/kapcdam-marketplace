"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { ProductFilters } from "../components/product-filters";
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
    setPriceRange,
    setPage,
    setSortBy,
    setPageSize,
    clearFilters,
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

  // Fetch categories for filters
  const { data: categories, isLoading: categoriesLoading } = useQuery(
    trpc.products.getCategories.queryOptions()
  );

  // Fetch price range for filters
  const { data: priceRange, isLoading: priceRangeLoading } = useQuery(
    trpc.products.getPriceRange.queryOptions()
  );

  const isLoading = productsLoading || categoriesLoading || priceRangeLoading;

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
      />

      <div className="flex gap-8 mt-8">
        {/* Filters Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <ProductFilters
            categories={categories || []}
            selectedCategory={category}
            onCategoryChange={setCategory}
            priceRange={priceRange}
            selectedMinPrice={minPrice}
            selectedMaxPrice={maxPrice}
            onPriceRangeChange={setPriceRange}
            onClearFilters={clearFilters}
            isLoading={isLoading}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1">
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
        </main>
      </div>
    </div>
  );
}