"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  Minus,
  Plus,
  Share2,
  Send,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { urlFor } from "@/sanity/lib/image";
import { PortableText } from "@portabletext/react";
import { useUser, SignInButton } from "@clerk/nextjs";
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
import { AddToCartButton } from "@/features/cart/ui/components/add-to-cart-btn";
import LikeProductButton from "@/features/products/ui/components/like-product-button";
import { RelatedProducts } from "@/features/products/ui/components/related-products";
import type { CartItemType } from "@/features/cart/schema";

interface ProductViewProps {
  slug: string;
}

export default function ProductView({ slug }: ProductViewProps) {
  const { isSignedIn, user } = useUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery(trpc.products.getOne.queryOptions({ slug }));

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [userVotes, setUserVotes] = useState<
    Record<string, "helpful" | "not_helpful">
  >({});

  // Fetch reviews data
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useQuery({
    ...trpc.reviews.getProductReviews.queryOptions({
      productId: product?._id || "",
      page: 1,
      pageSize: 10,
      sortBy: "newest",
    }),
    enabled: !!product,
  });

  const { data: reviewStats, isLoading: statsLoading } = useQuery({
    ...trpc.reviews.getReviewStats.queryOptions({
      productId: product?._id || "",
    }),
    enabled: !!product,
  });

  const handleVariantChange = (variantSku: string) => {
    setSelectedVariants({ variant: variantSku });
  };

  const handleQuantityChange = (change: number) => {
    if (!product) return;
    const maxStock = product.hasVariants
      ? selectedVariants.variant
        ? product.variantOptions?.find(
            (v) => v.sku === selectedVariants.variant
          )?.stock || 0
        : product.variantOptions?.[0]?.stock || 0
      : product.totalStock;
    setQuantity((prev) => Math.max(1, Math.min(maxStock, prev + change)));
  };

  const handleStarClick = (rating: number) => {
    setNewReview((prev) => ({ ...prev, rating }));
  };

  // Review submission mutation
  const createReviewMutation = useMutation(
    trpc.reviews.createReview.mutationOptions({
      onSuccess: () => {
        // Invalidate reviews queries to refresh data
        queryClient.invalidateQueries(
          trpc.reviews.getProductReviews.queryOptions({
            productId: product!._id,
            page: 1,
            pageSize: 10,
            sortBy: "newest",
          })
        );
        queryClient.invalidateQueries(
          trpc.reviews.getReviewStats.queryOptions({ productId: product!._id })
        );
        setNewReview({ rating: 0, comment: "" });
        toast.success("Review submitted successfully and is pending approval!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to submit review");
      },
    })
  );

  // Vote on review mutation
  const voteOnReviewMutation = useMutation(
    trpc.reviews.voteOnReview.mutationOptions({
      onSuccess: (data, variables) => {
        // Update local state to reflect the vote
        setUserVotes((prev) => ({
          ...prev,
          [variables.reviewId]: variables.voteType,
        }));

        // Invalidate reviews queries to refresh data
        queryClient.invalidateQueries(
          trpc.reviews.getProductReviews.queryOptions({
            productId: product!._id,
            page: 1,
            pageSize: 10,
            sortBy: "newest",
          })
        );

        toast.success("Thank you for your feedback!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to record your vote");
      },
    })
  );

  const handleSubmitReview = () => {
    if (!isSignedIn) {
      toast.error("Please sign in to submit a review");
      return;
    }
    if (!product) {
      toast.error("Product not found");
      return;
    }
    if (newReview.rating > 0 && newReview.comment.trim()) {
      createReviewMutation.mutate({
        productId: product._id,
        rating: newReview.rating,
        reviewText: newReview.comment,
      });
    } else {
      toast.error("Please provide both a rating and a comment");
    }
  };

  const handleThumbnailHover = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleVoteOnReview = (
    reviewId: string,
    voteType: "helpful" | "not_helpful"
  ) => {
    if (!isSignedIn) {
      toast.error("Please sign in to vote on reviews");
      return;
    }

    if (userVotes[reviewId]) {
      toast.error("You have already voted on this review");
      return;
    }
    voteOnReviewMutation.mutate({
      reviewId,
      voteType,
    });
  };

  const getCurrentPrice = () => {
    if (!product) return 0;
    if (
      product.hasVariants &&
      product.variantOptions &&
      product.variantOptions.length > 0
    ) {
      const selectedVariant = selectedVariants.variant
        ? product.variantOptions.find((v) => v.sku === selectedVariants.variant)
        : product.variantOptions.find((v) => v.isDefault) ||
          product.variantOptions[0];
      return Number.parseFloat(selectedVariant?.price || "0");
    }
    return Number.parseFloat(product.price || "0");
  };

  const getCurrentStock = () => {
    if (!product) return 0;
    if (
      product.hasVariants &&
      product.variantOptions &&
      product.variantOptions.length > 0
    ) {
      const selectedVariant = selectedVariants.variant
        ? product.variantOptions.find((v) => v.sku === selectedVariants.variant)
        : product.variantOptions.find((v) => v.isDefault) ||
          product.variantOptions[0];
      return selectedVariant?.stock || 0;
    }
    return product.totalStock || 0;
  };

  const currentImages = product?.images || [];
  const currentImage = currentImages[currentImageIndex];

  // Create cart item for AddToCartButton
  const cartItem: CartItemType | null = product
    ? {
        type: "product" as const,
        productId: product._id,
        courseId: null,
        selectedVariantSku: selectedVariants.variant || null,
        quantity: quantity,
        addedAt: new Date().toISOString(),
        preferredStartDate: null,
      }
    : null;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 mb-8 w-1/3"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200"></div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-16 h-16 bg-gray-200"></div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 w-2/3"></div>
              <div className="h-6 bg-gray-200 w-1/2"></div>
              <div className="h-12 bg-gray-200 w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-8">
          The product you're looking for doesn't exist or may have been removed.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline">Browse Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-8">
        <Link href="/" className="text-muted-foreground hover:text-primary">
          Home
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link
          href="/marketplace"
          className="text-muted-foreground hover:text-primary"
        >
          Marketplace
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link
          href={`/category/${product.category?.slug?.current || ""}`}
          className="text-muted-foreground hover:text-primary"
        >
          {product.category?.name || "Products"}
        </Link>
      </div>

      {/* Mobile Title - Shows first on mobile */}
      <div className="lg:hidden mb-6">
        <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.averageRating || 0)
                    ? "fill-yellow-400 stroke-yellow-400"
                    : "fill-gray-200 stroke-gray-200"
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              ({product.totalReviews || 0} reviews)
            </span>
          </div>
          <Badge variant="secondary">{product.category?.name}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {getCurrentStock() > 0
            ? `${getCurrentStock()} in stock`
            : "Out of stock"}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Left Column - Images (shows second on mobile) */}
        <div className="lg:sticky lg:top-8 lg:h-fit space-y-4">
          {/* Product Images */}
          <div className="aspect-square relative">
            {currentImage ? (
              <Image
                src={urlFor(currentImage).url() || "/placeholder.svg"}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
            {getCurrentStock() === 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold">Out of Stock</span>
              </div>
            )}
          </div>
          {/* Image Thumbnails */}
          {currentImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {currentImages.slice(0, 6).map((image, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 w-16 h-16 relative border-2 transition-colors cursor-pointer ${
                    i === currentImageIndex
                      ? "border-primary"
                      : "border-transparent hover:border-primary"
                  }`}
                  onMouseEnter={() => handleThumbnailHover(i)}
                >
                  <Image
                    src={urlFor(image).url() || "/placeholder.svg"}
                    alt={`Product view ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ))}
              {currentImages.length > 6 && (
                <button
                  className="flex-shrink-0 w-16 h-16 bg-muted flex items-center justify-center text-xs font-medium hover:bg-muted/80 transition-colors"
                  onClick={() => setShowImageDialog(true)}
                >
                  +{currentImages.length - 6}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile Price and Options - Shows after images on mobile */}
        <div className="lg:hidden space-y-6 mt-6">
          <div>
            <p className="text-2xl font-bold">
              UGX {getCurrentPrice().toLocaleString()}
            </p>
          </div>

          {/* Variants */}
          {product.hasVariants &&
            product.variantOptions &&
            product.variantOptions.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Options</Label>
                  <div className="flex flex-wrap gap-2">
                    {product.variantOptions.map((variant) => {
                      const isSelected =
                        selectedVariants.variant === variant.sku;
                      const isOutOfStock = (variant.stock || 0) === 0;
                      return (
                        <button
                          key={variant.sku}
                          onClick={() =>
                            !isOutOfStock && handleVariantChange(variant.sku)
                          }
                          disabled={isOutOfStock}
                          className={`px-4 py-2 border text-sm transition-colors ${
                            isOutOfStock
                              ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                              : isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "hover:bg-muted border-border"
                          }`}
                        >
                          <span className="flex flex-col items-center gap-1">
                            {variant.attributes?.map((attr, i) => (
                              <span key={i} className="text-xs">
                                {attr.attributeName}: {attr.value}
                              </span>
                            )) || <span>SKU: {variant.sku}</span>}
                            {isOutOfStock && (
                              <span className="text-xs">(Out of stock)</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label className="font-semibold">Quantity</Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-medium w-8 text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= getCurrentStock()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {cartItem && (
              <AddToCartButton
                product={cartItem}
                quantity={quantity}
                availableStock={getCurrentStock()}
              />
            )}
            {product && <LikeProductButton productId={product._id} />}
            <Button variant="outline" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right Column - Product Info (shows third on mobile) */}
        <div className="space-y-6">
          {/* Desktop Title - Hidden on mobile */}
          <div className="hidden lg:block">
            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.averageRating || 0)
                        ? "fill-yellow-400 stroke-yellow-400"
                        : "fill-gray-200 stroke-gray-200"
                    }`}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                  ({product.totalReviews || 0} reviews)
                </span>
              </div>
              <Badge variant="secondary">{product.category?.name}</Badge>
            </div>
            <p className="text-2xl font-bold">
              UGX {getCurrentPrice().toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {getCurrentStock() > 0
                ? `${getCurrentStock()} in stock`
                : "Out of stock"}
            </p>
          </div>

          {/* Desktop Price, Variants, Quantity - Hidden on mobile */}
          <div className="hidden lg:block space-y-6">
            {/* Variants */}
            {product.hasVariants &&
              product.variantOptions &&
              product.variantOptions.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Options</Label>
                    <div className="flex flex-wrap gap-2">
                      {product.variantOptions.map((variant) => {
                        const isSelected =
                          selectedVariants.variant === variant.sku;
                        const isOutOfStock = (variant.stock || 0) === 0;
                        return (
                          <button
                            key={variant.sku}
                            onClick={() =>
                              !isOutOfStock && handleVariantChange(variant.sku)
                            }
                            disabled={isOutOfStock}
                            className={`px-4 py-2 border text-sm transition-colors ${
                              isOutOfStock
                                ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                                : isSelected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "hover:bg-muted border-border"
                            }`}
                          >
                            <span className="flex flex-col items-center gap-1">
                              {variant.attributes?.map((attr, i) => (
                                <span key={i} className="text-xs">
                                  {attr.attributeName}: {attr.value}
                                </span>
                              )) || <span>SKU: {variant.sku}</span>}
                              {isOutOfStock && (
                                <span className="text-xs">(Out of stock)</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            {/* Quantity */}
            <div className="space-y-2">
              <Label className="font-semibold">Quantity</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-lg font-medium w-8 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= getCurrentStock()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {cartItem && (
                <AddToCartButton
                  product={cartItem}
                  quantity={quantity}
                  availableStock={getCurrentStock()}
                />
              )}
              {product && <LikeProductButton productId={product._id} />}
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Product Description */}
          {product.detailedDescription && (
            <div className="space-y-4 pt-6 border-t">
              <h3 className="font-semibold text-lg">Product Details</h3>
              <div className="prose prose-sm max-w-none">
                <PortableText value={product.detailedDescription} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section - Shows fourth on mobile */}
      <div className="mt-8 space-y-6">
        {/* Reviews Title */}
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Reviews</h3>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(reviewStats?.averageRating || 0)
                    ? "fill-yellow-400 stroke-yellow-400"
                    : "fill-gray-200 stroke-gray-200"
                }`}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-1">
              {reviewStats?.averageRating?.toFixed(1) || 0} (
              {reviewStats?.totalReviews || 0} reviews)
            </span>
          </div>
        </div>

        {/* Add Review Form */}
        {isSignedIn ? (
          <div className="space-y-4 p-4 bg-muted/50 border border-border">
            <h4 className="font-semibold">Write a Review</h4>
            <div className="space-y-2">
              <Label>Your Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleStarClick(star)}
                    className="transition-colors"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= newReview.rating
                          ? "fill-yellow-400 stroke-yellow-400"
                          : "fill-gray-200 stroke-gray-200 hover:fill-yellow-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-comment">Your Review</Label>
              <Textarea
                id="review-comment"
                value={newReview.comment}
                onChange={(e) =>
                  setNewReview((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                placeholder="Share your thoughts about this product..."
                rows={3}
              />
            </div>
            <Button
              onClick={handleSubmitReview}
              disabled={
                !newReview.rating ||
                !newReview.comment.trim() ||
                createReviewMutation.isPending
              }
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {createReviewMutation.isPending
                ? "Submitting..."
                : "Submit Review"}
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-muted/50 border border-border text-center">
            <p className="text-muted-foreground mb-4">
              Sign in to write a review
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Sign In to Review</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign in to write a review</AlertDialogTitle>
                  <AlertDialogDescription>
                    You need to be signed in to submit a product review.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <SignInButton>Sign In</SignInButton>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Existing Reviews */}
        <div className="space-y-4">
          <h4 className="font-semibold">Customer Reviews</h4>
          {reviewsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-b pb-4 animate-pulse">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, j) => (
                        <div
                          key={j}
                          className="w-4 h-4 bg-gray-200 rounded"
                        ></div>
                      ))}
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : reviewsData?.reviews.length ? (
            reviewsData.reviews.map((review) => (
              <div
                key={review._id}
                className="border-b last:border-0 pb-4 last:pb-0"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className={`w-4 h-4 ${
                          j < review.rating
                            ? "fill-yellow-400 stroke-yellow-400"
                            : "fill-gray-200 stroke-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    {review.user?.firstName || "Anonymous"}
                  </span>
                  {review.isVerifiedPurchase && (
                    <Badge variant="outline" className="text-xs">
                      Verified Purchase
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.title && (
                  <h5 className="font-medium text-sm mb-1">{review.title}</h5>
                )}
                <p className="text-muted-foreground">{review.reviewText}</p>

                {/* Vote counts and buttons */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {(review.helpfulCount > 0 ||
                      review.notHelpfulCount > 0) && (
                      <>
                        <span>{review.helpfulCount} found this helpful</span>
                        {review.notHelpfulCount > 0 && (
                          <span>
                            {review.notHelpfulCount} found this not helpful
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Voting buttons */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-2">
                      Was this helpful?
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVoteOnReview(review._id, "helpful")}
                      disabled={
                        !!userVotes[review._id] ||
                        voteOnReviewMutation.isPending
                      }
                      className={`h-8 px-2 text-xs ${
                        userVotes[review._id] === "helpful"
                          ? "bg-green-50 text-green-700"
                          : ""
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Yes ({review.helpfulCount})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleVoteOnReview(review._id, "not_helpful")
                      }
                      disabled={
                        !!userVotes[review._id] ||
                        voteOnReviewMutation.isPending
                      }
                      className={`h-8 px-2 text-xs ${
                        userVotes[review._id] === "not_helpful"
                          ? "bg-red-50 text-red-700"
                          : ""
                      }`}
                    >
                      <ThumbsDown className="w-3 h-3 mr-1" />
                      No ({review.notHelpfulCount})
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      <RelatedProducts
        productId={product._id}
        categoryId={product.category?._id}
      />
    </div>
  );
}
