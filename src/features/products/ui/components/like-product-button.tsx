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
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

type Props = {
  productId: string;
};

const LikeProductButton = ({ productId }: Props) => {
  const { isSignedIn } = useUser();
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const likedProducts = useQuery(trpc.products.getLikedProducts.queryOptions());

  const isLiked =
    likedProducts.data?.some((ref) => ref._ref === productId) || false;

  const likeProductMutation = useMutation(
    trpc.products.likeProduct.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(
          trpc.products.getLikedProducts.queryOptions()
        );
        toast.success("Product liked!");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const unlikeProductMutation = useMutation(
    trpc.products.unlikeProduct.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(
          trpc.products.getLikedProducts.queryOptions()
        );
        toast.success("Product removed from favorites!");
        setShowRemoveDialog(false);
      },
      onError: (error) => {
        toast.error(error.message);
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
        disabled={likeProductMutation.isPending}
      >
        <Heart
          className={cn("w-4 h-4", isLiked && "fill-red-500 text-red-500")}
        />
      </Button>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from favorites?</AlertDialogTitle>
            <AlertDialogDescription>
              This product will be removed from your liked products.
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
