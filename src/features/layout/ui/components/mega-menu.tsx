"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMegaMenuContext } from "./mega-menu-context";
import {
  LogIn,
  DollarSign,
  Handshake,
  Users,
  Target,
  Sparkles,
  BookOpen,
  BarChart2,
  Eye,
  LinkIcon,
  Droplet,
  HeartPulse,
  Lightbulb,
} from "lucide-react";

// Icon mapping to resolve icon names to components
const iconMap = {
  DollarSign,
  Handshake,
  Users,
  Target,
  Sparkles,
  BookOpen,
  BarChart2,
  Eye,
  LinkIcon,
  Droplet,
  HeartPulse,
  Lightbulb,
  LogIn,
} as const;

type IconName = keyof typeof iconMap;

interface MegaMenuItem {
  title: string;
  description?: string;
  href: string;
  icon?: IconName; // Changed from React.ElementType to IconName
}

interface MegaMenuSection {
  heading: string;
  items: MegaMenuItem[];
}

interface MegaMenuProps {
  label: string;
  sections: MegaMenuSection[];
  id?: string; // Optional ID, will generate one if not provided
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

export default function MegaMenu({ label, sections, id }: MegaMenuProps) {
  const menuId = React.useMemo(
    () => id || `mega-menu-${Math.random().toString(36).substr(2, 9)}`,
    [id]
  );
  const { openMenus, setMenuOpen } = useMegaMenuContext();
  const isOpen = openMenus.has(menuId);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = React.useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setMenuOpen(menuId, true);
  }, [menuId, setMenuOpen]);

  const handleMouseLeave = React.useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setMenuOpen(menuId, false);
    }, 100); // Small delay to account for hover transition
  }, [menuId, setMenuOpen]);

  const handleLinkClick = React.useCallback(() => {
    setMenuOpen(menuId, false);
  }, [menuId, setMenuOpen]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      setMenuOpen(menuId, false);
    };
  }, [menuId, setMenuOpen]);

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
            className="fixed top-[calc(theme(spacing.24)+theme(spacing.2))] left-0 right-0 mx-auto w-full max-w-7xl rounded-lg bg-white p-6 shadow-xl ring-1 ring-black ring-opacity-5 z-50"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={menuVariants as Variants}
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
                      const Icon = item.icon ? iconMap[item.icon] : null;
                      return (
                        <motion.li key={itemIndex} variants={itemVariants}>
                          <Link
                            href={item.href}
                            className="group flex items-start space-x-3 rounded-md p-2 hover:bg-gray-50 transition-colors duration-200"
                            onClick={handleLinkClick}
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
