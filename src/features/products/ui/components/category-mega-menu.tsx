"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Category } from "@/features/products/schemas";
import { cn } from "@/lib/utils";

interface CategoryMegaMenuProps {
  isOpen: boolean;
  categories: Category[];
  onCategorySelect: (categoryId: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  selectedCategory: string | null;
}

const menuVariants = {
  hidden: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 }
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      duration: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

export function CategoryMegaMenu({
  isOpen,
  categories,
  onCategorySelect,
  onMouseEnter,
  onMouseLeave,
  selectedCategory,
}: CategoryMegaMenuProps) {
  if (categories.length === 0) return null;

  // Calculate grid columns based on number of categories
  const getGridColumns = () => {
    if (categories.length <= 3) return "grid-cols-1";
    if (categories.length <= 6) return "grid-cols-2";
    if (categories.length <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-64 max-w-4xl"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={menuVariants}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div className="p-4">
            <div className={cn(
              "grid gap-2",
              getGridColumns()
            )}>
              {categories.map((category, index) => (
                <motion.div
                  key={category._id}
                  variants={itemVariants}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant={selectedCategory === category._id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onCategorySelect(category._id)}
                    className={cn(
                      "w-full justify-start text-left h-auto py-2 px-3",
                      "hover:bg-gray-50 transition-colors duration-200"
                    )}
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {category.name}
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}