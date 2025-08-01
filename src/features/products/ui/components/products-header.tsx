"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortOption } from "../hooks/use-products-filters";

interface ProductsHeaderProps {
  search: string | null;
  onSearchChange: (search: string) => void;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  resultsCount: number;
  isLoading: boolean;
}

export function ProductsHeader({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  resultsCount,
  isLoading,
}: ProductsHeaderProps) {
  const [searchInput, setSearchInput] = useState(search || "");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  useEffect(() => {
    setSearchInput(search || "");
  }, [search]);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground mt-1">
          {isLoading
            ? "Loading products..."
            : `${resultsCount.toLocaleString()} ${resultsCount === 1 ? "product" : "products"} found`}
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 w-full sm:w-80"
          />
        </div>

        {/* Sort Select */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name-asc">Name: A to Z</SelectItem>
            <SelectItem value="name-desc">Name: Z to A</SelectItem>
            {search && <SelectItem value="relevance">Most Relevant</SelectItem>}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
