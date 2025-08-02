"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortOption } from "../hooks/use-products-filters";
import { CategoryButton } from "./category-button";
import { Category } from "@/features/products/schemas";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProductsHeaderProps {
  search: string | null;
  onSearchChange: (search: string) => void;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  resultsCount: number;
  isLoading: boolean;
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export function ProductsHeader({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  resultsCount,
  isLoading,
  categories,
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
}: ProductsHeaderProps) {
  const [searchInput, setSearchInput] = useState(search || "");
  const isMobile = useIsMobile();
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products and Courses</h1>
          {selectedType === "all" && (
            <p className="text-muted-foreground mt-1">
              {isLoading
                ? "Loading items..."
                : `${resultsCount.toLocaleString()} ${resultsCount === 1 ? "item" : "items"} found`}
            </p>
          )}
          {selectedType === "course" && (
            <p className="text-muted-foreground mt-1">
              {isLoading
                ? "Loading courses..."
                : `${resultsCount.toLocaleString()} ${resultsCount === 1 ? "course" : "courses"} found`}
            </p>
          )}
          {selectedType === "product" && (
            <p className="text-muted-foreground mt-1">
              {isLoading
                ? "Loading products..."
                : `${resultsCount.toLocaleString()} ${resultsCount === 1 ? "product" : "products"} found`}
            </p>
          )}
        </div>
      </div>
      {isMobile && (
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search marketplace..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      )}

      {/* Controls Row: Category, Search, Sort */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Category Button */}
        <div
          className={cn(
            "flex-shrink-0 flex items-center gap-2 w-full sm:w-auto"
          )}
        >
          <Button
            variant={selectedType === "all" ? "default" : "outline"}
            onClick={() => onTypeChange("all")}
            className="flex items-center gap-2 min-w-[80px] justify-center flex-shrink-0"
          >
            All
          </Button>
          <Button
            variant={selectedType === "products" ? "default" : "outline"}
            onClick={() => onTypeChange("products")}
            className="flex items-center gap-2 justify-center flex-1 sm:flex-none sm:min-w-[100px]"
          >
            Products
          </Button>
          <Button
            variant={selectedType === "courses" ? "default" : "outline"}
            onClick={() => onTypeChange("courses")}
            className="flex items-center gap-2 justify-center flex-1 sm:flex-none sm:min-w-[100px]"
          >
            Courses
          </Button>
        </div>
        {selectedType !== "courses" && (
          <div className={cn("flex-shrink-0", isMobile && "flex-grow w-full")}>
            <CategoryButton
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Search Input */}
        {!isMobile && (
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search marketplace..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        )}

        {/* Sort Select */}
        <div className="flex-shrink-0">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-48">
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
              {search && (
                <SelectItem value="relevance">Most Relevant</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
