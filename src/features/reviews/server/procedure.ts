import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  baseProcedure,
  protectedProcedure,
} from "@/trpc/init";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import {
  createReviewInputSchema,
  getProductReviewsInputSchema,
  voteOnReviewInputSchema,
  updateReviewInputSchema,
  deleteReviewInputSchema,
  getUserReviewsInputSchema,
  reviewsResponseSchema,
  userReviewsResponseSchema,
  reviewStatsSchema,
  reviewSchema,
} from "../schemas";

export const reviewsRouter = createTRPCRouter({
  // Get reviews for a specific product
  getProductReviews: baseProcedure
    .input(getProductReviewsInputSchema)
    .query(async ({ input }) => {
      const { productId, page, pageSize, sortBy } = input;
      const offset = (page - 1) * pageSize;

      // Define sort order based on sortBy parameter
      let orderBy = "createdAt desc";
      switch (sortBy) {
        case "oldest":
          orderBy = "createdAt asc";
          break;
        case "highest_rating":
          orderBy = "rating desc, createdAt desc";
          break;
        case "lowest_rating":
          orderBy = "rating asc, createdAt desc";
          break;
        case "most_helpful":
          orderBy = "helpfulCount desc, createdAt desc";
          break;
        default:
         orderBy = "createdAt desc";
      }

      const query = groq`{
        "reviews": *[_type == "reviews" && product._ref == $productId && status == "approved" && isActive == true] | order(${orderBy}) [${offset}...${offset + pageSize}] {
          _id,
          rating,
          title,
          reviewText,
          isVerifiedPurchase,
          helpfulCount,
          notHelpfulCount,
          createdAt,
          user-> {
            firstName,
            email
          }
        },
        "total": count(*[_type == "reviews" && product._ref == $productId && status == "approved" && isActive == true])
      }`;

      try {
        const result = await client.fetch(query, { productId });

        const response = {
          reviews: result.reviews || [],
          total: result.total || 0,
          hasMore: result.total > offset + pageSize,
          currentPage: page,
          totalPages: Math.ceil((result.total || 0) / pageSize),
        };

        return reviewsResponseSchema.parse(response);
      } catch (error) {
        console.error("Error fetching product reviews:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch product reviews",
        });
      }
    }),

  // Get review statistics for a product
  getReviewStats: baseProcedure
    .input(getProductReviewsInputSchema.pick({ productId: true }))
    .query(async ({ input }) => {
      const { productId } = input;

      const query = groq`{
        "averageRating": math::avg(*[_type == "reviews" && product._ref == $productId && status == "approved" && isActive == true].rating),
        "totalReviews": count(*[_type == "reviews" && product._ref == $productId && status == "approved" && isActive == true]),
        "ratingDistribution": {
          "5": count(*[_type == "reviews" && product._ref == $productId && status == "approved" && isActive == true && rating == 5]),
          "4": count(*[_type == "reviews" && product._ref == $productId && status == "approved" && isActive == true && rating == 4]),
          "3": count(*[_type == "reviews" && product._ref == $productId && status == "approved" && isActive == true && rating == 3]),
          "2": count(*[_type == "reviews" && product._ref == $productId && status == "approved" && isActive == true && rating == 2]),
          "1": count(*[_type == "reviews" && product._ref == $productId && status == "approved" && isActive == true && rating == 1])
        }
      }`;

      try {
        const result = await client.fetch(query, { productId });
        return reviewStatsSchema.parse(result);
      } catch (error) {
        console.error("Error fetching review stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch review statistics",
        });
      }
    }),

  // Create a new review (protected)
  createReview: protectedProcedure
    .input(createReviewInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { productId, rating, title, reviewText } = input;
      const { userId } = ctx.auth;

      try {
        // Check if user already has a review for this product
        const existingReview = await client.fetch(
          groq`*[_type == "reviews" && product._ref == $productId && user._ref == $userId][0]`,
          { productId, userId }
        );

        if (existingReview) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You have already reviewed this product",
          });
        }

        // Get user reference
        const user = await client.fetch(
          groq`*[_type == "user" && clerkUserId == $userId][0]`,
          { userId }
        );

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Verify product exists
        const product = await client.fetch(
          groq`*[_type == "product" && _id == $productId][0]{ _id }`,
          { productId }
        );

        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        // Create the review
        const newReview = await client.create({
          _type: "reviews",
          user: {
            _type: "reference",
            _ref: user._id,
          },
          itemType: "product",
          product: {
            _type: "reference",
            _ref: productId,
          },
          rating,
          title: title || null,
          reviewText,
          isVerifiedPurchase: false, // For now, we'll handle verification separately
          status: "pending", // Reviews start as pending for moderation
          helpfulCount: 0,
          notHelpfulCount: 0,
          voteRecords: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        });

        return {
          success: true,
          reviewId: newReview._id,
          message: "Review submitted successfully and is pending approval",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error creating review:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create review",
        });
      }
    }),

  // Update an existing review (protected, author only)
  updateReview: protectedProcedure
    .input(updateReviewInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { reviewId, rating, title, reviewText } = input;
      const { userId } = ctx.auth;

      try {
        // Get the review and verify ownership
        const review = await client.fetch(
          groq`*[_type == "reviews" && _id == $reviewId][0]{
            _id,
            user-> { clerkUserId }
          }`,
          { reviewId }
        );

        if (!review) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Review not found",
          });
        }

        if (review.user?.clerkUserId !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only edit your own reviews",
          });
        }

        // Prepare update data
        const updateData: any = {
          updatedAt: new Date().toISOString(),
          status: "pending", // Re-moderate after edit
        };

        if (rating) updateData.rating = rating;
        if (title !== undefined) updateData.title = title || null;
        if (reviewText) updateData.reviewText = reviewText;

        // Update the review
        await client.patch(reviewId).set(updateData).commit();

        return {
          success: true,
          message: "Review updated successfully and is pending re-approval",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error updating review:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update review",
        });
      }
    }),

  // Delete a review (protected, author only)
  deleteReview: protectedProcedure
    .input(deleteReviewInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { reviewId } = input;
      const { userId } = ctx.auth;

      try {
        // Get the review and verify ownership
        const review = await client.fetch(
          groq`*[_type == "reviews" && _id == $reviewId][0]{
            _id,
            user-> { clerkUserId }
          }`,
          { reviewId }
        );

        if (!review) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Review not found",
          });
        }

        if (review.user?.clerkUserId !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own reviews",
          });
        }

        // Soft delete by setting isActive to false
        await client
          .patch(reviewId)
          .set({
            isActive: false,
            updatedAt: new Date().toISOString(),
          })
          .commit();

        return {
          success: true,
          message: "Review deleted successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error deleting review:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete review",
        });
      }
    }),

  // Get user's reviews (protected)
  getUserReviews: protectedProcedure
    .input(getUserReviewsInputSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input;
      const { userId } = ctx.auth;
      const offset = (page - 1) * pageSize;

      const query = groq`{
        "reviews": *[_type == "reviews" && user->clerkUserId == $userId && isActive == true] | order(createdAt desc) [${offset}...${offset + pageSize}] {
          _id,
          rating,
          title,
          reviewText,
          isVerifiedPurchase,
          helpfulCount,
          notHelpfulCount,
          createdAt,
          user-> {
            firstName,
            email
          },
          product-> {
            _id,
            title,
            slug
          }
        },
        "total": count(*[_type == "reviews" && user->clerkUserId == $userId && isActive == true])
      }`;

      try {
        const result = await client.fetch(query, { userId });

        const response = {
          reviews: result.reviews || [],
          total: result.total || 0,
          hasMore: result.total > offset + pageSize,
          currentPage: page,
          totalPages: Math.ceil((result.total || 0) / pageSize),
        };

        return userReviewsResponseSchema.parse(response);
      } catch (error) {
        console.error("Error fetching user reviews:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch your reviews",
        });
      }
    }),

  // Vote on a review as helpful or not helpful (protected)
  voteOnReview: protectedProcedure
    .input(voteOnReviewInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { reviewId, voteType } = input;
      const { userId } = ctx.auth;

      try {
        // Get user reference
        const user = await client.fetch(
          groq`*[_type == "user" && clerkUserId == $userId][0]`,
          { userId }
        );

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Get the review with current vote records
        const review = await client.fetch(
          groq`*[_type == "reviews" && _id == $reviewId][0]{
            _id,
            helpfulCount,
            notHelpfulCount,
            voteRecords
          }`,
          { reviewId }
        );

        if (!review) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Review not found",
          });
        }

        // Check if user has already voted
        const existingVote = review.voteRecords?.find(
          (vote: any) => vote.user._ref === user._id
        );

        if (existingVote) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You have already voted on this review",
          });
        }

        // Add the vote record
        const newVoteRecord = {
          _key: `vote-${user._id}-${Date.now()}`,
          user: {
            _type: "reference",
            _ref: user._id,
          },
          voteType,
          votedAt: new Date().toISOString(),
        };

        // Update counts and add vote record
        const updateData: any = {
          voteRecords: [...(review.voteRecords || []), newVoteRecord],
          updatedAt: new Date().toISOString(),
        };

        if (voteType === "helpful") {
          updateData.helpfulCount = (review.helpfulCount || 0) + 1;
        } else {
          updateData.notHelpfulCount = (review.notHelpfulCount || 0) + 1;
        }

        await client.patch(reviewId).set(updateData).commit();

        return {
          success: true,
          message: "Vote recorded successfully",
          helpfulCount:
            voteType === "helpful"
              ? updateData.helpfulCount
              : review.helpfulCount,
          notHelpfulCount:
            voteType === "not_helpful"
              ? updateData.notHelpfulCount
              : review.notHelpfulCount,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error voting on review:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record vote",
        });
      }
    }),
});
