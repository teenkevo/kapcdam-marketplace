"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export function WriteReviewButton({ productId }: { productId: string }) {
const isMobile = useIsMobile()
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createReview = useMutation(
    trpc.reviews.createReview.mutationOptions({
      onSuccess: () => {
        toast.success("Review submitted");
        setOpen(false);
        setRating(0);
        setComment("");
        queryClient.invalidateQueries({
          queryKey: ["reviews", "getProductReviews"],
        });
        queryClient.invalidateQueries({
          queryKey: ["reviews", "getReviewStats"],
        });
      },
      onError: (e) => toast.error(e.message || "Failed to submit review"),
    })
  );

  const canSubmit =
    rating > 0 && comment.trim().length > 0 && !createReview.isPending;

  const body = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Your Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="transition-colors"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= rating
                    ? "fill-yellow-400 stroke-yellow-400"
                    : "fill-gray-200 stroke-gray-200 hover:fill-yellow-200"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="review-text">Your Review</Label>
        <Textarea
          id="review-text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about this product..."
          rows={3}
        />
      </div>
      <Button
        disabled={!canSubmit}
        onClick={() =>
          createReview.mutate({ productId, rating, reviewText: comment })
        }
        className="w-full"
      >
        {createReview.isPending ? "Submitting..." : "Submit Review"}
      </Button>
    </div>
  );

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Write a review
      </Button>
      {isMobile ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Write a review</DialogTitle>
            </DialogHeader>
            {body}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Write a review</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">{body}</div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
