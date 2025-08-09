"use client";

import {
  CreditCard,
  Heart,
  LogOut,
  PlusCircle,
  Settings,
  ShoppingBag,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useWishlistStore } from "@/features/products/store/use-wishlist-store";

export function UserNavButton() {
  const { setIsWishlistOpen } = useWishlistStore();

  const { user } = useUser();
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="size-10">
            <AvatarImage src={user.imageUrl || ""} alt={user.fullName || ""} />
            <AvatarFallback>AV</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="flex items-center gap-2 p-2">
          <Avatar className="size-10">
            <AvatarImage src={user.imageUrl || ""} alt={user.fullName || ""} />
            <AvatarFallback>AV</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/account" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Manage Account</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/your-orders" className="flex items-center">
              <ShoppingBag className="mr-2 h-4 w-4" />
              <span>My orders</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/your-addresses" className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>My addresses</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsWishlistOpen(true)}>
            <Heart className="mr-2 h-4 w-4" />
            <span>Wishlist</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            <SignOutButton>
              <button>Sign out</button>
            </SignOutButton>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
