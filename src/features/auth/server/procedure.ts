import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  baseProcedure,
} from "@/trpc/init";
import { z } from "zod";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { createClerkClient } from "@clerk/nextjs/server";
import { userProfileSchema, userWebhookSchema } from "../schemas";
import { sanityFetch } from "@/sanity/lib/live";

export const userRouter = createTRPCRouter({
  syncUserWebhook: baseProcedure
    .input(userWebhookSchema)
    .mutation(async ({ input }) => {
      try {
        if (input.eventType === "user.created") {
          const createdUser = await client.createIfNotExists({
            _id: `user-${input.clerkUserId}`,
            _type: "user",
            clerkUserId: input.clerkUserId,
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            preferences: {
              notifications: true,
              marketing: false,
            },
          });
          return createdUser;
        } else {
          // user.updated - patch existing user
          return await client
            .patch(`user-${input.clerkUserId}`)
            .set({
              email: input.email,
              firstName: input.firstName,
              lastName: input.lastName,
              phone: input.phone,
            })
            .commit();
        }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync user",
        });
      }
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { auth } = ctx;
    try {
      const user = await client.fetch(
        groq`*[_type == "user" && clerkUserId == $clerkUserId][0]`,
        { clerkUserId: auth.userId }
      );

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User profile not found",
        });
      }

      return user;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get user profile",
      });
    }
  }),

  updateProfile: protectedProcedure
    .input(userProfileSchema)
    .mutation(async ({ input, ctx }) => {
      const { auth } = ctx;

      try {
        const currentUser = await client.fetch(
          groq`*[_type == "user" && clerkUserId == $clerkUserId][0]`,
          { clerkUserId: auth.userId }
        );

        if (!currentUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }


        const updatedUser = await client
          .patch(currentUser._id)
          .set({
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            preferences: input.preferences,
          })
          .commit();

        return updatedUser;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        });
      }
    }),


  cleanupOrphanedUsers: baseProcedure.mutation(async ({ ctx }) => {
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    try {
      const sanityUsers = await client.fetch(
        groq`*[_type == "user"]{ _id, clerkUserId }`
      );

      if (!sanityUsers.length) return { cleaned: 0 };

      const clerkUsers = await clerkClient.users.getUserList({
        limit: 500,
      });

      const clerkUserIds = new Set(clerkUsers.data.map((user) => user.id));

      const orphanedUsers = sanityUsers.filter(
        (sanityUser: any) => !clerkUserIds.has(sanityUser.clerkUserId)
      );

      const deletePromises = orphanedUsers.map((user: any) =>
        client.delete(user._id)
      );

      await Promise.all(deletePromises);

      return {
        cleaned: orphanedUsers.length,
        orphanedUserIds: orphanedUsers.map((u: any) => u.clerkUserId),
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cleanup orphaned users",
      });
    }
  }),

  deleteUserWebhook: baseProcedure
    .input(
      z.object({
        clerkUserId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const userToDelete = await client.fetch(
          groq`*[_type == "user" && clerkUserId == $clerkUserId][0]`,
          { clerkUserId: input.clerkUserId }
        );

        if (!userToDelete) {
          return { deleted: false, message: "User not found in Sanity" };
        }

        await client.delete(userToDelete._id);

        return { deleted: true, deletedId: userToDelete._id };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete user",
        });
      }
    }),
});
