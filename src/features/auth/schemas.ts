import { z } from "zod";

export const userWebhookSchema = z.object({
  eventType: z.enum(["user.created", "user.updated"]),
  clerkUserId: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
});

export const userProfileSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z
    .string()
    .regex(/^[+]?[0-9\s\-\(\)]{7,15}$/)
    .optional(),
  preferences: z.object({
    notifications: z.boolean(),
    marketing: z.boolean(),
  }),
});

export const sanityUserSchema = z.object({
  _id: z.string(),
  _type: z.literal("user"),
  clerkUserId: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  status: z.enum(["active", "deactivated", "archived"]),
  preferences: z.object({
    notifications: z.boolean(),
    marketing: z.boolean(),
  }),
  likedProducts: z
    .array(
      z.object({
        _ref: z.string(),
        _type: z.literal("reference"),
      })
    )
    .optional(),
  deactivatedAt: z.string().datetime().optional(),
  deactivationReason: z
    .enum(["user_deleted", "admin_deactivated", "compliance", "orphaned"])
    .optional(),
});
