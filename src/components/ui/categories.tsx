"use client";

import * as React from "react";
import {
  Book,
  Check,
  ChevronsUpDown,
  EyeClosed,
  GitCommitVertical,
  Home,
  Shirt,
} from "lucide-react";

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

const categories = [
  {
    value: "home-accessories",
    label: "Home Accessories",
    icon: Home,
  },
  {
    value: "fashion",
    label: "Fashion",
    icon: Shirt,
  },
  {
    value: "health-and-beauty",
    label: "Health & Beauty",
    icon: EyeClosed,
  },
  {
    value: "jewellery",
    label: "Jewellery",
    icon: GitCommitVertical,
  },
  {
    value: "books",
    label: "Books",
    icon: Book,
  },
];

export function Categories() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          //   variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[220px] border-stone-700 justify-between"
        >
          {value
            ? categories.find((category) => category.value === value)?.label
            : "Select Category"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0">
        <Command>
          <CommandInput placeholder="Search category..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category.value}
                  value={category.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <category.icon className={cn("mr-2 h-4 w-4 opacity-40")} />
                  {category.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === category.value ? "opacity-100" : "opacity-0"
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
