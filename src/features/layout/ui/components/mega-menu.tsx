"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming Button is imported from shadcn/ui
import { cn } from "@/lib/utils";

interface MegaMenuItem {
  title: string;
  description?: string;
  href: string;
  icon?: React.ElementType;
}

interface MegaMenuSection {
  heading: string;
  items: MegaMenuItem[];
}

interface MegaMenuProps {
  label: string;
  sections: MegaMenuSection[];
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const menuVariants = {
  hidden: { opacity: 0, y: 0, transition: { duration: 0.3 } },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export default function MegaMenu({ label, sections }: MegaMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100); // Small delay to account for hover transition
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Button
        variant="ghost"
        className={cn(
          "h-32 flex items-center gap-1 border-b-2 border-transparent"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown
          className={cn(
            "ml-1 h-4 w-4 transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0"
          )}
        />
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-[calc(theme(spacing.32)+theme(spacing.2))] left-0 right-0 mx-auto w-full max-w-7xl rounded-lg bg-white p-6 shadow-xl ring-1 ring-black ring-opacity-5 z-50"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={menuVariants}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {section.heading}
                  </h3>
                  <ul className="space-y-2">
                    {section.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      return (
                        <motion.li key={itemIndex} variants={itemVariants}>
                          <Link
                            href={item.href}
                            className="group flex items-start space-x-3 rounded-md p-2 hover:bg-gray-50 transition-colors duration-200"
                          >
                            {Icon && (
                              <Icon className="h-6 w-6 text-gray-500 group-hover:text-gray-700 transition-colors duration-200" />
                            )}
                            <div>
                              <p className="text-base font-medium text-gray-900 group-hover:text-gray-700">
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="text-sm text-gray-500 group-hover:text-gray-600">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </Link>
                        </motion.li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
