"use client";

import { useState } from "react";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Category, PriceRange } from "@/features/products/schemas";

interface ProductFiltersProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string) => void;
  priceRange: PriceRange | undefined;
  selectedMinPrice: number | null;
  selectedMaxPrice: number | null;
  onPriceRangeChange: (min: number | null, max: number | null) => void;
  onClearFilters: () => void;
  isLoading: boolean;
}

export function ProductFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  selectedMinPrice,
  selectedMaxPrice,
  onPriceRangeChange,
  onClearFilters,
  isLoading,
}: ProductFiltersProps) {
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([
    selectedMinPrice || priceRange?.minPrice || 0,
    selectedMaxPrice || priceRange?.maxPrice || 100000,
  ]);

  const hasActiveFilters = selectedCategory || selectedMinPrice || selectedMaxPrice;

  const handlePriceRangeChange = (values: number[]) => {
    const [min, max] = values;
    setLocalPriceRange([min, max]);
    
    // Apply price filter immediately
    onPriceRangeChange(
      min === (priceRange?.minPrice || 0) ? null : min,
      max === (priceRange?.maxPrice || 100000) ? null : max
    );
  };

  const formatPrice = (price: number) => {
    return `UGX ${price.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Filters */}
        {hasActiveFilters && (
          <>
            <div>
              <Label className="text-sm font-medium mb-2 block">Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1">
                    {categories.find(c => c._id === selectedCategory)?.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => onCategoryChange("")}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {(selectedMinPrice || selectedMaxPrice) && (
                  <Badge variant="secondary" className="gap-1">
                    {formatPrice(selectedMinPrice || priceRange?.minPrice || 0)} - {formatPrice(selectedMaxPrice || priceRange?.maxPrice || 100000)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => onPriceRangeChange(null, null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Category Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Category</Label>
          <RadioGroup
            value={selectedCategory || ""}
            onValueChange={onCategoryChange}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="" id="all-categories" />
              <Label htmlFor="all-categories" className="text-sm cursor-pointer">
                All Categories
              </Label>
            </div>
            {categories.map((category) => (
              <div key={category._id} className="flex items-center space-x-2">
                <RadioGroupItem value={category._id} id={category._id} />
                <Label htmlFor={category._id} className="text-sm cursor-pointer">
                  {category.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Price Range Filter */}
        {priceRange && (
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Price Range
            </Label>
            <div className="space-y-4">
              <Slider
                value={localPriceRange}
                onValueChange={handlePriceRangeChange}
                min={priceRange.minPrice}
                max={priceRange.maxPrice}
                step={1000}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatPrice(localPriceRange[0])}</span>
                <span>{formatPrice(localPriceRange[1])}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}