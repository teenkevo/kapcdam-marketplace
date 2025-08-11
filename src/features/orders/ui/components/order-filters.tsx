"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useQueryStates, parseAsString } from "nuqs";

interface OrderFiltersProps {
  totalOrders: number;
  userJoinDate?: string;
}

export function OrderFilters({ totalOrders, userJoinDate }: OrderFiltersProps) {
  // URL search params state
  const [urlParams, setUrlParams] = useQueryStates({
    timeRange: parseAsString.withDefault("all"),
    searchQuery: parseAsString.withDefault(""),
  });
  
  // Local input state for search field (separate from URL param)
  const [searchInput, setSearchInput] = useState(urlParams.searchQuery);

  // Generate year options based on user join date
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const joinYear = userJoinDate 
      ? new Date(userJoinDate).getFullYear() 
      : currentYear;
    
    const years = [];
    for (let year = currentYear; year >= joinYear; year--) {
      years.push(year.toString());
    }
    return years;
  };

  // Keep search input in sync with URL param when it changes externally
  useEffect(() => {
    setSearchInput(urlParams.searchQuery);
  }, [urlParams.searchQuery]);

  // Handle manual search (button click or Enter key)
  const handleSearch = useCallback(() => {
    if (searchInput !== urlParams.searchQuery) {
      setUrlParams({ searchQuery: searchInput || null });
    }
  }, [searchInput, urlParams.searchQuery, setUrlParams]);

  // Handle search input changes
  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchInput("");
    setUrlParams({ searchQuery: null });
  }, [setUrlParams]);

  // Handle Enter key in search input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // Handle time range changes
  const handleTimeRangeChange = useCallback((value: string) => {
    setUrlParams({ timeRange: value === "all" ? null : value });
  }, [setUrlParams]);

  const getTimeRangeLabel = (value: string) => {
    switch (value) {
      case "30days":
        return "Last 30 days";
      case "3months":
        return "Past 3 months";
      default:
        return value; // Year
    }
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      {/* Left side - Order count and time range */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <p className="text-gray-600 text-sm">
          {totalOrders} {totalOrders === 1 ? "order" : "orders"} placed in
        </p>
        <Select value={urlParams.timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="3months">Past 3 months</SelectItem>
            {getYearOptions().map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right side - Search */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by order number or product name..."
            value={searchInput}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10"
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button 
          onClick={handleSearch}
          disabled={searchInput === urlParams.searchQuery}
          className="bg-[#C5F82A] text-black hover:bg-[#B4E729] font-semibold px-4"
        >
          Search
        </Button>
      </div>
    </div>
  );
}