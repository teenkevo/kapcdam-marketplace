import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  baseProcedure,
  protectedProcedure,
} from "@/trpc/init";
import { z } from "zod";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";

// Schema for coupon validation input
const validateCouponInput = z.object({
  code: z.string().min(1, "Coupon code is required"),
  orderTotal: z.number().min(0, "Order total must be positive"),
  userId: z.string().optional(),
  cartItems: z
    .array(
      z.object({
        type: z.enum(["product", "course"]),
        productId: z.string().optional(),
        courseId: z.string().optional(),
        quantity: z.number().min(1),
      })
    )
    .optional(),
});

// Schema for coupon validation response
const couponValidationResponse = z.object({
  valid: z.boolean(),
  discount: z
    .object({
      percentage: z.number(),
      amount: z.number(), // Calculated discount amount
      code: z.string(),
      description: z.string().nullable().optional(),
    })
    .optional(),
  error: z.string().optional(),
});

export const couponRouter = createTRPCRouter({
  validateCoupon: baseProcedure
    .input(validateCouponInput)
    .output(couponValidationResponse)
    .mutation(async ({ input }) => {
      console.log("Validating coupon:", input.code);

      try {
        // Validate input
        if (!input.code || input.code.trim().length === 0) {
          return {
            valid: false,
            error: "Coupon code is required",
          };
        }

        // Fetch coupon from Sanity
        const couponQuery = groq`*[_type == "discountCodes" && code == $code][0] {
          _id,
          code,
          title,
          description,
          percentage,
          isActive,
          startDate,
          endDate,
          currentUses,
          maxUses,
          maxUsesPerUser,
          minimumOrderAmount,
          firstTimeCustomersOnly,
          excludedProducts,
          excludedCourses,
          usedBy[] {
            user->{_id, clerkUserId},
            usedAt,
            discountAmount,
            orderTotal
          }
        }`;

        console.log("Executing GROQ query for code:", input.code.toUpperCase());
        const coupon = await client.fetch(couponQuery, {
          code: input.code.toUpperCase(),
        });
        console.log("Coupon query result:", coupon ? "Found" : "Not found");

        if (!coupon) {
          console.log("Coupon not found for code:", input.code);
          return {
            valid: false,
            error: "Invalid coupon code",
          };
        }

        // Check if coupon has required fields
        if (!coupon.percentage || typeof coupon.percentage !== "number") {
          console.log("Coupon missing percentage field:", coupon);
          return {
            valid: false,
            error: "Invalid coupon configuration",
          };
        }

        // Check if coupon is active
        if (!coupon.isActive) {
          console.log("Coupon is not active:", coupon.code);
          return {
            valid: false,
            error: "This coupon is no longer active",
          };
        }

        // Check date validity
        const now = new Date();
        const startDate = new Date(coupon.startDate);
        const endDate = new Date(coupon.endDate);

        if (now < startDate) {
          return {
            valid: false,
            error: "This coupon is not yet active",
          };
        }

        if (now > endDate) {
          return {
            valid: false,
            error: "This coupon has expired",
          };
        }

        // Check minimum order amount
        if (
          coupon.minimumOrderAmount &&
          input.orderTotal < coupon.minimumOrderAmount
        ) {
          return {
            valid: false,
            error: `Minimum order amount of UGX ${coupon.minimumOrderAmount.toLocaleString()} required`,
          };
        }

        // Check maximum uses
        if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
          return {
            valid: false,
            error: "This coupon has reached its usage limit",
          };
        }

        // Check per-user usage limit if user is provided
        if (input.userId && coupon.maxUsesPerUser) {
          const userUsageCount =
            coupon.usedBy?.filter(
              (usage: any) => usage.user?.clerkUserId === input.userId
            ).length || 0;

          if (userUsageCount >= coupon.maxUsesPerUser) {
            return {
              valid: false,
              error: "You have reached the usage limit for this coupon",
            };
          }
        }

        // Check if user is first-time customer (if required)
        if (coupon.firstTimeCustomersOnly && input.userId) {
          // This would require checking if user has previous orders
          // For now, we'll skip this check or implement basic logic
        }

        // Check excluded products/courses
        if (
          input.cartItems &&
          (coupon.excludedProducts?.length || coupon.excludedCourses?.length)
        ) {
          const hasExcludedItems = input.cartItems.some((item) => {
            if (
              item.type === "product" &&
              coupon.excludedProducts?.includes(item.productId)
            ) {
              return true;
            }
            if (
              item.type === "course" &&
              coupon.excludedCourses?.includes(item.courseId)
            ) {
              return true;
            }
            return false;
          });

          if (hasExcludedItems) {
            return {
              valid: false,
              error:
                "Some items in your cart are not eligible for this discount",
            };
          }
        }

        // Calculate discount amount (always percentage now)
        const discountAmount = Math.round(
          (input.orderTotal * coupon.percentage) / 100
        );

        const result = {
          valid: true,
          discount: {
            percentage: coupon.percentage,
            amount: discountAmount,
            code: coupon.code,
            description: coupon.title,
          },
        };

        console.log("Coupon validation successful:", result);
        return result;
      } catch (error) {
        console.error("Coupon validation error:", error);

        // Ensure we always return a valid response structure even on error
        return {
          valid: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to validate coupon",
        };
      }
    }),

  applyCoupon: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        orderNumber: z.string(),
        orderTotal: z.number(),
        discountAmount: z.number(),
        orderId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { auth } = ctx;

        // Get the discount code
        const coupon = await client.fetch(
          groq`*[_type == "discountCodes" && code == $code][0]`,
          { code: input.code.toUpperCase() }
        );

        if (!coupon) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Discount code not found",
          });
        }

        // Get user document
        const user = await client.fetch(
          groq`*[_type == "user" && clerkUserId == $clerkUserId][0]`,
          { clerkUserId: auth.userId }
        );

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Add usage record to the discount code
        const usageRecord = {
          _key: `usage-${Date.now()}`,
          user: { _type: "reference", _ref: user._id },
          usedAt: new Date().toISOString(),
          order: { _type: "reference", _ref: input.orderId },
          orderNumber: input.orderNumber,
          discountAmount: input.discountAmount,
          orderTotal: input.orderTotal,
        };

        // Update the discount code with new usage
        await client
          .patch(coupon._id)
          .setIfMissing({ usedBy: [] })
          .append("usedBy", [usageRecord])
          .inc({ currentUses: 1 })
          .inc({ totalDiscountGiven: input.discountAmount })
          .inc({ totalOrderValue: input.orderTotal })
          .commit();

        return {
          success: true,
          message: "Coupon applied and tracked successfully",
        };
      } catch (error) {
        console.error("Apply coupon error:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to apply coupon",
        });
      }
    }),
});

export type CouponValidationInput = z.infer<typeof validateCouponInput>;
export type CouponValidationResponse = z.infer<typeof couponValidationResponse>;
