"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category } from "@/features/products/schemas";
import { CategoryMegaMenu } from "./category-mega-menu";

interface CategoryNavigationProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string) => void;
  isLoading?: boolean;
}

export function CategoryNavigation({
  categories,
  selectedCategory,
  onCategoryChange,
  isLoading = false,
}: CategoryNavigationProps) {
  const [openMegaMenu, setOpenMegaMenu] = useState<string | null>(null);

  // Group categories by parent/child structure
  const parentCategories = categories.filter(cat => !cat.hasParent || !cat.parent);
  const childCategories = categories.filter(cat => cat.hasParent && cat.parent);

  // Group child categories by parent
  const categoriesByParent = childCategories.reduce((acc, child) => {
    const parentId = child.parent?._id;
    if (parentId) {
      if (!acc[parentId]) {
        acc[parentId] = [];
      }
      acc[parentId].push(child);
    }
    return acc;
  }, {} as Record<string, Category[]>);

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId);
    setOpenMegaMenu(null);
  };

  const handleMouseEnter = (categoryId: string) => {
    setOpenMegaMenu(categoryId);
  };

  const handleMouseLeave = () => {
    // Small delay to allow moving to mega menu
    setTimeout(() => setOpenMegaMenu(null), 150);
  };

  if (isLoading) {
    return (
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-6 py-4">
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 bg-white relative">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center space-x-3 md:space-x-6 py-4 overflow-x-auto scrollbar-hide">
          {/* All Categories Button */}
          <Button
            variant={!selectedCategory ? "default" : "ghost"}
            size="sm"
            onClick={() => handleCategorySelect("")}
            className="whitespace-nowrap flex-shrink-0 text-xs md:text-sm"
          >
            All Categories
          </Button>

          {/* Parent Categories */}
          {parentCategories.map((category) => {
            const hasChildren = categoriesByParent[category._id]?.length > 0;
            const isSelected = selectedCategory === category._id || 
              categoriesByParent[category._id]?.some(child => child._id === selectedCategory);

            return (
              <div
                key={category._id}
                className="relative flex-shrink-0"
                onMouseEnter={() => hasChildren && handleMouseEnter(category._id)}
                onMouseLeave={handleMouseLeave}
              >
                <Button
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleCategorySelect(category._id)}
                  className={cn(
                    "whitespace-nowrap text-xs md:text-sm",
                    hasChildren && "pr-1"
                  )}
                >
                  {category.name}
                  {hasChildren && (
                    <ChevronDown
                      className={cn(
                        "ml-1 h-3 w-3 transition-transform duration-200",
                        openMegaMenu === category._id ? "rotate-180" : "rotate-0"
                      )}
                    />
                  )}
                </Button>

                {/* Mega Menu for Child Categories - Hidden on mobile */}
                {hasChildren && (
                  <div className="hidden md:block">
                    <CategoryMegaMenu
                      isOpen={openMegaMenu === category._id}
                      categories={categoriesByParent[category._id] || []}
                      onCategorySelect={handleCategorySelect}
                      onMouseEnter={() => setOpenMegaMenu(category._id)}
                      onMouseLeave={handleMouseLeave}
                      selectedCategory={selectedCategory}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Mobile dropdown for child categories */}
      {parentCategories.map((category) => {
        const hasChildren = categoriesByParent[category._id]?.length > 0;
        const isParentSelected = selectedCategory === category._id;
        const hasSelectedChild = categoriesByParent[category._id]?.some(child => child._id === selectedCategory);
        
        if (!hasChildren || (!isParentSelected && !hasSelectedChild)) return null;

        return (
          <div key={`mobile-${category._id}`} className="md:hidden border-t border-gray-100 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="text-xs font-medium text-gray-600 mb-2">
                {category.name} Categories:
              </div>
              <div className="flex flex-wrap gap-2">
                {categoriesByParent[category._id].map((childCategory) => (
                  <Button
                    key={childCategory._id}
                    variant={selectedCategory === childCategory._id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategorySelect(childCategory._id)}
                    className="text-xs h-7"
                  >
                    {childCategory.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}