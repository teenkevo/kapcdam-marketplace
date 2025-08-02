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
  const [type, setType] = useQueryState(
    "type",
    parseAsString.withDefault("all")
  );
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
      setPage(1);
    },
    [setMinPrice, setMaxPrice, setPage]
  );

  // Helper to clear all filters
  const clearFilters = useCallback(() => {
    setSearch("");
    setType("all");
    setCategory("");
    setMinPrice(null);
    setMaxPrice(null);
    setPage(1);
    setSortBy("newest");
  }, [
    setSearch,
    setCategory,
    setMinPrice,
    setMaxPrice,
    setPage,
    setSortBy,
    setType,
  ]);

  // Override setters to reset page when filters change
  const setTypeWithReset = useCallback(
    (value: string) => {
      setType(value);
      setPage(1);
      // Clear category when switching to courses since courses don't have categories
      if (value === "courses" && category) {
        setCategory("");
      }
    },
    [setType, setPage, setCategory, category]
  );
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
      // When a category is selected, switch to products type since courses don't have categories
      if (value && type !== "products") {
        setType("products");
      }
    },
    [setCategory, setPage, setType, type]
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
    type: (type as "all" | "products" | "courses") || "all",
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
    setType: setTypeWithReset,
    setSortBy: setSortByWithReset,
    setPageSize,
    clearFilters,
  };
}
