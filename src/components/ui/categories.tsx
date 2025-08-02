"use client";

import * as React from "react";
import {
  Check,
  ChevronsUpDown,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Categories() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const router = useRouter();
  const trpc = useTRPC();

  // Fetch categories from Sanity
  const { data: categories, isLoading } = useQuery(
    trpc.products.getCategories.queryOptions()
  );

  // Filter to get only parent categories for the dropdown
  const parentCategories = categories?.filter(cat => !cat.hasParent || !cat.parent) || [];

  const handleCategorySelect = (categoryId: string) => {
    if (categoryId === value) {
      setValue("");
      router.push("/marketplace");
    } else {
      setValue(categoryId);
      router.push(`/marketplace?category=${categoryId}`);
    }
    setOpen(false);
  };

  const selectedCategory = parentCategories.find(cat => cat._id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          //   variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[220px] border-stone-700 justify-between"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : selectedCategory?.name || "Select Category"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0">
        <Command>
          <CommandInput placeholder="Search category..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {parentCategories.map((category) => (
                <CommandItem
                  key={category._id}
                  value={category.name}
                  onSelect={() => handleCategorySelect(category._id)}
                >
                  <Package className={cn("mr-2 h-4 w-4 opacity-40")} />
                  {category.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === category._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
