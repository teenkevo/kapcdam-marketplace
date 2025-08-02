import { z } from "zod";

// Base review schemas
const reviewUserSchema = z.object({
  firstName: z.string().nullable(),
  email: z.string().nullable(),
});

const reviewSchema = z.object({
  _id: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().nullable().optional(),
  reviewText: z.string().nullable().optional(),
  isVerifiedPurchase: z.boolean(),
  helpfulCount: z.number().min(0),
  notHelpfulCount: z.number().min(0),
  createdAt: z.string(),
  user: reviewUserSchema.nullable(),
});

const reviewStatsSchema = z.object({
  averageRating: z.number().nullable(),
  totalReviews: z.number(),
  ratingDistribution: z.object({
    "1": z.number(),
    "2": z.number(),
    "3": z.number(),
    "4": z.number(),
    "5": z.number(),
  }),
});

// Input schemas
const createReviewInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.number().min(1).max(5).int(),
  title: z.string().max(100).optional(),
  reviewText: z.string().max(1000).min(1, "Review text is required"),
});

const getProductReviewsInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(50).default(10),
  sortBy: z
    .enum(["newest", "oldest", "highest_rating", "lowest_rating", "most_helpful"])
    .default("newest"),
});

const voteOnReviewInputSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  voteType: z.enum(["helpful", "not_helpful"]),
});

const updateReviewInputSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  rating: z.number().min(1).max(5).int().optional(),
  title: z.string().max(100).optional(),
  reviewText: z.string().max(1000).min(1).optional(),
});

const deleteReviewInputSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
});

const getUserReviewsInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(50).default(10),
});

// Response schemas
const reviewsResponseSchema = z.object({
  reviews: z.array(reviewSchema),
  total: z.number(),
  hasMore: z.boolean(),
  currentPage: z.number(),
  totalPages: z.number(),
});

const userReviewsResponseSchema = z.object({
  reviews: z.array(
    reviewSchema.extend({
      product: z.object({
        _id: z.string(),
        title: z.string(),
        slug: z.object({
          current: z.string(),
        }),
      }).nullable(),
    })
  ),
  total: z.number(),
  hasMore: z.boolean(),
  currentPage: z.number(),
  totalPages: z.number(),
});

export {
  // Schemas
  reviewSchema,
  reviewStatsSchema,
  reviewUserSchema,

  // Input schemas
  createReviewInputSchema,
  getProductReviewsInputSchema,
  voteOnReviewInputSchema,
  updateReviewInputSchema,
  deleteReviewInputSchema,
  getUserReviewsInputSchema,

  // Response schemas
  reviewsResponseSchema,
  userReviewsResponseSchema,
};

export type Review = z.infer<typeof reviewSchema>;
export type ReviewStats = z.infer<typeof reviewStatsSchema>;
export type ReviewUser = z.infer<typeof reviewUserSchema>;

export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
export type GetProductReviewsInput = z.infer<typeof getProductReviewsInputSchema>;
export type VoteOnReviewInput = z.infer<typeof voteOnReviewInputSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewInputSchema>;
export type DeleteReviewInput = z.infer<typeof deleteReviewInputSchema>;
export type GetUserReviewsInput = z.infer<typeof getUserReviewsInputSchema>;

export type ReviewsResponse = z.infer<typeof reviewsResponseSchema>;
export type UserReviewsResponse = z.infer<typeof userReviewsResponseSchema>;