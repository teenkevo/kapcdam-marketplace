"use client";

import {
  CreditCard,
  Heart,
  LogOut,
  PlusCircle,
  Settings,
  ShoppingBag,
  Shield,
  Home,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useWishlistStore } from "@/features/products/store/use-wishlist-store";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function UserNavButton() {
  const { setIsWishlistOpen } = useWishlistStore();
  const trpc = useTRPC();

  const { user } = useUser();

  // Check if user is an admin
  const { data: adminProfile, isLoading: isLoadingAdmin } = useQuery({
    ...trpc.adminUser.getProfile.queryOptions(),
    enabled: !!user,
    retry: false,
    // If this fails, user is likely not an admin
  });

  if (!user) return null;

  const isAdmin = !!adminProfile && !isLoadingAdmin;

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
            <p className="text-sm font-medium">
              {user.fullName}
              {isAdmin && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Admin
                </span>
              )}
            </p>
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

          {isAdmin ? (
            // Admin-specific navigation
            <>
              <DropdownMenuItem asChild>
                <Link href="/admin/manage-orders" className="flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Manage Orders</span>
                </Link>
              </DropdownMenuItem>
            </>
          ) : (
            // Customer-specific navigation
            <>
              <DropdownMenuItem asChild>
                <Link href="/your-orders" className="flex items-center">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  <span>My orders</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsWishlistOpen(true)}>
                <Heart className="mr-2 h-4 w-4" />
                <span>Wishlist</span>
              </DropdownMenuItem>
            </>
          )}

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
