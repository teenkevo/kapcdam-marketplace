"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { debouncedToast } from "@/lib/toast-utils";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  productId: string;
};

const LikeProductButton = ({ productId }: Props) => {
  const { isSignedIn } = useUser();
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const likedProducts = useQuery(trpc.products.getLikedProducts.queryOptions());

  // Check if user is an admin
  const { data: adminProfile, isLoading: isLoadingAdmin } = useQuery({
    ...trpc.adminUser.getProfile.queryOptions(),
    enabled: isSignedIn,
    retry: false,
    // If this fails, user is likely not an admin
  });

  const isAdmin = !!adminProfile && !isLoadingAdmin;

  const isLiked =
    likedProducts.data?.some((ref) => ref._ref === productId) || false;

  const likeProductMutation = useMutation(
    trpc.products.likeProduct.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(
          trpc.products.getLikedProducts.queryOptions()
        );
        debouncedToast.success("Added to wishlist", {
          classNames: {
            toast: "bg-[#e8f8e8] border-green-500",
            icon: "text-[#03a53e]",
            title: "text-[#03a53e]",
            description: "text-black",
            actionButton: "bg-zinc-400",
            cancelButton: "bg-orange-400",
            closeButton: "bg-lime-400",
          },
        });
      },
      onError: (error) => {
        toast.error(error.message, {
          classNames: {
            toast: "bg-[#ffebeb] border-[#ef4444]",
            icon: "text-[#ef4444]",
            title: "text-[#ef4444]",
            description: "text-black",
            actionButton: "bg-zinc-400",
            cancelButton: "bg-orange-400",
            closeButton: "bg-lime-400",
          },
        });
      },
    })
  );

  const unlikeProductMutation = useMutation(
    trpc.products.unlikeProduct.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(
          trpc.products.getLikedProducts.queryOptions()
        );
        debouncedToast.success("Removed from wishlist", {
          classNames: {
            toast: "bg-[#e8f8e8] border-green-500",
            icon: "text-[#03a53e]",
            title: "text-[#03a53e]",
            description: "text-black",
            actionButton: "bg-zinc-400",
            cancelButton: "bg-orange-400",
            closeButton: "bg-lime-400",
          },
        });
        setShowRemoveDialog(false);
      },
      onError: (error) => {
        toast.error(error.message, {
          classNames: {
            toast: "bg-[#ffebeb] border-[#ef4444]",
            icon: "text-[#ef4444]",
            title: "text-[#ef4444]",
            description: "text-black",
            actionButton: "bg-zinc-400",
            cancelButton: "bg-orange-400",
            closeButton: "bg-lime-400",
          },
        });
      },
    })
  );

  const handleLikeProduct = () => {
    if (isLiked) {
      setShowRemoveDialog(true);
    } else {
      likeProductMutation.mutate({ productId });
    }
  };

  const handleRemoveFromLiked = () => {
    unlikeProductMutation.mutate({ productId });
  };

  // If admin, show disabled button with tooltip
  if (isAdmin) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="shrink-0 bg-gray-100 cursor-not-allowed"
              disabled
            >
              <Heart className="w-4 h-4 text-gray-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Wishlist is only available to customers</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!isSignedIn) {
    return (
      <AlertDialog>
        <AlertDialogTrigger
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <Heart className="w-4 h-4" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign in to like this product</AlertDialogTitle>
            <AlertDialogDescription>Sign in to continue</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>
              <SignInButton>Sign in</SignInButton>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <>
      <Button
        size="icon"
        variant="outline"
        className="shrink-0"
        onClick={handleLikeProduct}
        disabled={
          likeProductMutation.isPending || unlikeProductMutation.isPending
        }
      >
        {likeProductMutation.isPending || unlikeProductMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Heart
            className={cn(
              "w-4 h-4 transition-all duration-300",
              isLiked && "fill-black",
              (likeProductMutation.isPending ||
                unlikeProductMutation.isPending) &&
                "scale-125"
            )}
          />
        )}
      </Button>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from wishlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This product will be removed from your wishlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromLiked}
              disabled={unlikeProductMutation.isPending}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LikeProductButton;
