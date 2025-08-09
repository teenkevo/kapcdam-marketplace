"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { HeartOff, Loader2 } from "lucide-react";
import { NumericFormat } from "react-number-format";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { urlFor } from "@/sanity/lib/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWishlistStore } from "../../store/use-wishlist-store";
import { AddToCartButton } from "@/features/cart/ui/components/add-to-cart-btn";
import { toast } from "sonner";
import { ProductListItem } from "../../schemas";
import { ScrollArea } from "@/components/ui/scroll-area";

function WishlistContent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { isSignedIn } = useUser();

  const { data: likedItems, isLoading } = useQuery({
    ...trpc.products.getLikedProductDetails.queryOptions(),
    enabled: isSignedIn,
  });

  const unlikeMutation = useMutation(
    trpc.products.unlikeProduct.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.products.getLikedProductDetails.queryOptions()
        );
        queryClient.invalidateQueries(
          trpc.products.getLikedProducts.queryOptions()
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleRemove = (productId: string) => {
    unlikeMutation.mutate({ productId });
  };

  const items = likedItems || [];

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <HeartOff className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Sign in to view your wishlist
        </h3>
        <p className="text-muted-foreground">
          Your liked products will appear here.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <HeartOff className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
        <p className="text-muted-foreground">
          Like products to save them for later.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="h-full flex-1 pt-4 px-4 md:px-0 space-y-4">
        {items.map((p) => (
          <div
            key={p._id}
            className="flex items-start gap-4 bg-gray-50 p-4 rounded-lg"
          >
            <Image
              src={
                p.defaultImage
                  ? urlFor(p.defaultImage).width(80).height(80).url()
                  : "/placeholder.svg?height=80&width=80"
              }
              alt={p.title}
              width={64}
              height={64}
              className="w-16 h-16 object-cover rounded-md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4
                  className="text-sm font-medium text-gray-900 truncate"
                  title={p.title}
                >
                  {p.title}
                </h4>
              </div>
              <div className="flex items-center justify-between mt-1">
                <NumericFormat
                  thousandSeparator={true}
                  displayType="text"
                  prefix="UGX "
                  value={parseInt(p.price) || 0}
                  className="text-sm font-semibold"
                />
                <span className="text-xs text-muted-foreground">
                  {p.totalStock > 0 ? "In stock" : "Out of stock"}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <AddToCartButton
                  product={{
                    type: "product",
                    productId: p._id,
                    selectedVariantSku: p.hasVariants
                      ? (p.variantOptions?.find((v) => v.isDefault)?.sku ??
                        undefined)
                      : undefined,
                    quantity: 1,
                  }}
                  availableStock={
                    p.hasVariants
                      ? (p.variantOptions?.find((v) => v.isDefault)?.stock ?? 0)
                      : p.totalStock
                  }
                  appearance="subtle"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleRemove(p._id)}
                  disabled={unlikeMutation.isPending}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}

export function WishlistSheet() {
  const isMobile = useIsMobile();
  const { isWishlistOpen, setIsWishlistOpen } = useWishlistStore();

  if (isMobile) {
    return (
      <Drawer open={isWishlistOpen} onOpenChange={setIsWishlistOpen}>
        <DrawerContent className="h-[85vh] pb-52">
          <DrawerHeader>
            <DrawerTitle>Wishlist</DrawerTitle>
          </DrawerHeader>
          <WishlistContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isWishlistOpen} onOpenChange={setIsWishlistOpen}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Wishlist</SheetTitle>
        </SheetHeader>
        <WishlistContent />
      </SheetContent>
    </Sheet>
  );
}
