"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/features/products/schemas";

interface CategoryButtonProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string) => void;
  isLoading?: boolean;
}

const menuVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

export function CategoryButton({
  categories,
  selectedCategory,
  onCategoryChange,
  isLoading = false,
}: CategoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredParent, setHoveredParent] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null); // Ref for the entire menu container
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For delaying hoveredParent clear

  // Group categories by parent/child structure
  const parentCategories = categories.filter(
    (cat) => !cat.hasParent || !cat.parent
  );
  const childCategories = categories.filter(
    (cat) => cat.hasParent && cat.parent
  );

  // Group child categories by parent
  const categoriesByParent = childCategories.reduce(
    (acc, child) => {
      const parentId = child.parent?._id;
      if (parentId) {
        if (!acc[parentId]) {
          acc[parentId] = [];
        }
        acc[parentId].push(child);
      }
      return acc;
    },
    {} as Record<string, Category[]>
  );

  const handleToggleMenu = () => {
    setIsOpen(!isOpen);
    // When opening, reset hoveredParent
    if (!isOpen) {
      setHoveredParent(null);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    // Check if the click occurred outside the menuRef element
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      // [^2]
      setIsOpen(false);
      setHoveredParent(null);
    }
  };

  const handleParentHover = (parentId: string) => {
    // Clear any pending leave timeout when hovering over a parent
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setHoveredParent(parentId);
  };

  const handleMenuLeave = () => {
    // Set a timeout to clear hoveredParent after a short delay
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredParent(null);
    }, 150); // Adjust delay as needed
  };

  const handleMenuEnter = () => {
    // Clear the timeout if the mouse re-enters the menu
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId);
    setIsOpen(false);
    setHoveredParent(null); // Clear hoveredParent on selection
  };

  // Get selected category name
  const getSelectedCategoryName = () => {
    if (!selectedCategory) return "All Categories";
    const selected = categories.find((cat) => cat._id === selectedCategory);
    return selected?.name || "All Categories";
  };

  // Handle click outside to close menu
  useEffect(() => {
    if (isOpen) {
      // Use 'mousedown' instead of 'click' for more immediate response
      // and to prevent issues with clicks on elements that might be removed from DOM
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // Clear any pending leave timeout when component unmounts or isOpen changes to false
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, [isOpen]); // Depend on isOpen

  if (isLoading) {
    return (
      <div className="relative">
        <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full" data-category-menu ref={menuRef}>
      {" "}
      {/* Attach ref here */}
      <Button
        variant="outline"
        onClick={handleToggleMenu}
        className={cn(
          "flex items-center gap-2 min-w-[140px] justify-between w-full",
          isOpen && "bg-gray-50"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="truncate">{getSelectedCategoryName()}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0"
          )}
        />
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-full md:min-w-[500px] max-w-2xl mt-1"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={menuVariants}
            onMouseLeave={handleMenuLeave}
            onMouseEnter={handleMenuEnter}
          >
            <div className="p-4">
              <div className="grid grid-cols-2 gap-6">
                {/* First Column: Parent Categories */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">
                    Categories
                  </h3>
                  <div className="space-y-1">
                    {" "}
                    {/* Removed onMouseEnter/Leave from here */}
                    {/* All Categories Option */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCategorySelect("")}
                      className={cn(
                        "w-full justify-start text-left h-auto py-2 px-3 transition-colors duration-150",
                        !selectedCategory
                          ? "bg-gray-100 hover:bg-gray-200"
                          : "hover:bg-gray-50"
                      )}
                    >
                      All Categories
                    </Button>
                    {/* Parent Categories */}
                    {parentCategories.map((category) => {
                      const isSelected =
                        selectedCategory === category._id ||
                        categoriesByParent[category._id]?.some(
                          (child) => child._id === selectedCategory
                        );
                      const isHovered = hoveredParent === category._id;
                      return (
                        <Button
                          key={category._id}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCategorySelect(category._id)}
                          onMouseEnter={() => handleParentHover(category._id)} // Keep this
                          // No onMouseLeave here
                          className={cn(
                            "w-full justify-start text-left h-auto py-2 px-3 transition-colors duration-150",
                            isSelected
                              ? "bg-gray-100 hover:bg-gray-200"
                              : "hover:bg-gray-50",
                            isHovered && !isSelected && "bg-gray-50"
                          )}
                        >
                          <div>
                            <div className="font-medium text-xs md:text-sm">
                              {category.name}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
                {/* Second Column: Child Categories */}
                <div className="pr-4">
                  {(() => {
                    // Priority: hovered parent > selected parent > popular children
                    const displayParent = hoveredParent
                      ? parentCategories.find(
                          (cat) => cat._id === hoveredParent
                        )
                      : parentCategories.find(
                          (cat) =>
                            cat._id === selectedCategory ||
                            categoriesByParent[cat._id]?.some(
                              (child) => child._id === selectedCategory
                            )
                        );
                    const childrenToShow = displayParent
                      ? categoriesByParent[displayParent._id] || []
                      : childCategories.slice(0, 8); // Show first 8 if no parent hovered/selected

                    if (childrenToShow.length === 0) {
                      return (
                        <div className="text-center text-gray-500 text-sm mt-8">
                          {displayParent
                            ? "No subcategories available"
                            : "Hover over a category to view subcategories"}
                        </div>
                      );
                    }

                    return (
                      <>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          Subcategories
                        </h3>
                        <p className="text-xs text-gray-500 pb-2 border-b">
                          {displayParent ? `${displayParent.name}` : "Popular"}
                        </p>
                        <motion.div
                          className="space-y-1"
                          key={displayParent?._id || "popular"}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {childrenToShow.map((category, index) => (
                            <motion.div
                              key={category._id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                delay: index * 0.03,
                                duration: 0.2,
                              }}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleCategorySelect(category._id)
                                }
                                className={cn(
                                  "w-full justify-start text-left h-auto py-2 px-3 transition-colors duration-150",
                                  selectedCategory === category._id
                                    ? "bg-gray-100 hover:bg-gray-200"
                                    : "hover:bg-gray-50"
                                )}
                              >
                                <div className="font-medium text-xs md:text-sm truncate">
                                  {category.name}
                                </div>
                              </Button>
                            </motion.div>
                          ))}
                        </motion.div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
