import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { useCallback } from "react";

// Define the sort options type to match the schema
export type SortOption =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc"
  | "relevance";

export function useProductsFilters() {
  // URL state for search and filters
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withDefault("")
  );
  const [minPrice, setMinPrice] = useQueryState("minPrice", parseAsInteger);
  const [maxPrice, setMaxPrice] = useQueryState("maxPrice", parseAsInteger);
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize, setPageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(12)
  );
  const [sortBy, setSortBy] = useQueryState(
    "sort",
    parseAsString.withDefault("newest").withOptions({
      clearOnDefault: true,
    })
  );

  // Helper to set price range together
  const setPriceRange = useCallback(
    (min: number | null, max: number | null) => {
      setMinPrice(min);
      setMaxPrice(max);
      setPage(1); // Reset to first page when filters change
    },
    [setMinPrice, setMaxPrice, setPage]
  );

  // Helper to clear all filters
  const clearFilters = useCallback(() => {
    setSearch("");
    setCategory("");
    setMinPrice(null);
    setMaxPrice(null);
    setPage(1);
    setSortBy("newest");
  }, [setSearch, setCategory, setMinPrice, setMaxPrice, setPage, setSortBy]);

  // Override setters to reset page when filters change
  const setSearchWithReset = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
    },
    [setSearch, setPage]
  );

  const setCategoryWithReset = useCallback(
    (value: string) => {
      setCategory(value);
      setPage(1);
    },
    [setCategory, setPage]
  );

  const setSortByWithReset = useCallback(
    (value: SortOption) => {
      setSortBy(value);
      setPage(1);
    },
    [setSortBy, setPage]
  );

  return {
    // Current state
    search: search || null,
    category: category || null,
    minPrice,
    maxPrice,
    page,
    pageSize,
    sortBy: (sortBy as SortOption) || "newest",

    // Setters
    setSearch: setSearchWithReset,
    setCategory: setCategoryWithReset,
    setPriceRange,
    setPage,
    setSortBy: setSortByWithReset,
    setPageSize,
    clearFilters,
  };
}
