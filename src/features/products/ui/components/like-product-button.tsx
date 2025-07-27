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
import { useMutation } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";

type Props = {
  productId: string;
};

const LikeProductButton = ({ productId }: Props) => {
  const { isSignedIn } = useUser();
  const trpc = useTRPC();
  const likeProductMutation = useMutation(
    trpc.products.likeProduct.mutationOptions({
      onSuccess: (data) => {
        toast.success("Product liked!");
        console.log(`Total liked products: ${data.likedProductsCount}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleLikeProduct = () => {
    likeProductMutation.mutate({ productId });
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
    <Button
      size="icon"
      variant="outline"
      className="shrink-0"
      onClick={handleLikeProduct}
    >
      <Heart className="w-4 h-4" />
    </Button>
  );
};

export default LikeProductButton;
