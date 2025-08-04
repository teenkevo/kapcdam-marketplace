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

export const userRouter = createTRPCRouter({
  syncUserWebhook: baseProcedure
    .input(userWebhookSchema)
    .mutation(async ({ input }) => {
      try {
        if (
          input.eventType === "user.created" ||
          input.eventType === "user.updated"
        ) {
          // Get additional data from Clerk if needed (like metadata)
          const clerkClient = createClerkClient({
            secretKey: process.env.CLERK_SECRET_KEY,
          });

          const clerkUser = await clerkClient.users.getUser(input.clerkUserId);

          // Extract phone and preferences from Clerk metadata
          const phone =
            input.phone || (clerkUser.unsafeMetadata?.phone as string) || "";
          const preferences = {
            notifications:
              (clerkUser.unsafeMetadata?.notifications as boolean) ?? true,
            marketing:
              (clerkUser.unsafeMetadata?.marketing as boolean) ?? false,
          };

          // First, check if a user with this Clerk ID already exists
          const existingUserByClerkId = await client.fetch(
            groq`*[_type == "user" && clerkUserId == $clerkUserId][0]`,
            { clerkUserId: input.clerkUserId }
          );

          // Then, check if a user with this email already exists (but different Clerk ID)
          const existingUserByEmail = await client.fetch(
            groq`*[_type == "user" && email == $email && clerkUserId != $clerkUserId][0]`,
            {
              email: input.email,
              clerkUserId: input.clerkUserId,
            }
          );

          let syncedUser;

          // Handle different scenarios
          if (existingUserByClerkId) {
            // Update existing user with same Clerk ID
            syncedUser = await client
              .patch(existingUserByClerkId._id)
              .set({
                email: input.email,
                firstName: input.firstName,
                lastName: input.lastName,
                phone: phone,
                preferences: preferences,
                status: "active", // Reactivate if deactivated
              })
              .commit();
          } else if (existingUserByEmail) {
            // This is likely a user who deleted their Clerk account and recreated it
            // Update the existing user with the new Clerk ID and reactivate
            console.log(
              `Reactivating user with email ${input.email}, updating Clerk ID from ${existingUserByEmail.clerkUserId} to ${input.clerkUserId}`
            );

            syncedUser = await client
              .patch(existingUserByEmail._id)
              .set({
                clerkUserId: input.clerkUserId, // Update to new Clerk ID
                firstName: input.firstName,
                lastName: input.lastName,
                phone: phone,
                preferences: preferences,
                status: "active", // Reactivate the account
              })
              .commit();
          } else {
            // No existing user found, create a new one with consistent ID format
            syncedUser = await client.createIfNotExists({
              _id: `user-${input.clerkUserId}`,
              _type: "user",
              clerkUserId: input.clerkUserId,
              email: input.email,
              firstName: input.firstName,
              lastName: input.lastName,
              phone: phone,
              status: "active",
              preferences: preferences,
            });
          }

          // Handle cart creation for the user
          if (syncedUser) {
            // Check if user already has a cart
            const existingCart = await client.fetch(
              groq`*[_type == "cart" && user._ref == $userId][0]`,
              { userId: syncedUser._id }
            );

            if (!existingCart) {
              // Create a forever cart for the user
              await client.createIfNotExists({
                _id: `cart-${input.clerkUserId}`,
                _type: "cart",
                user: {
                  _type: "reference",
                  _ref: syncedUser._id,
                },
                cartItems: [],
              });

              console.log(`Created cart for user ${input.clerkUserId}`);
            } else {
              console.log(`Cart already exists for user ${input.clerkUserId}`);
            }
          }

          return syncedUser;
        } else {
          // user.updated - this shouldn't happen since we handle both created and updated above
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unexpected event type",
          });
        }
      } catch (error) {
        console.error("Failed to sync user:", error);
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
        // First, update the user in Clerk (this will trigger the webhook)
        const clerkClient = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY,
        });

        const updatedClerkUser = await clerkClient.users.updateUser(
          auth.userId,
          {
            firstName: input.firstName,
            lastName: input.lastName,
            // Note: Clerk doesn't store phone in the main user object,
            // but we'll handle phone in the webhook through privateMetadata or unsafeMetadata
            unsafeMetadata: {
              ...input.preferences,
              phone: input.phone,
            },
          }
        );

        // The webhook will automatically sync the updated data to Sanity
        // So we can return the updated Clerk user data immediately,
        return {
          _id: `user-${updatedClerkUser.id}`,
          _type: "user",
          clerkUserId: updatedClerkUser.id,
          email: updatedClerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: updatedClerkUser.firstName || "",
          lastName: updatedClerkUser.lastName || "",
          phone: (updatedClerkUser.unsafeMetadata?.phone as string) || "",
          preferences: {
            notifications:
              (updatedClerkUser.unsafeMetadata?.notifications as boolean) ??
              true,
            marketing:
              (updatedClerkUser.unsafeMetadata?.marketing as boolean) ?? false,
          },
          status: "active",
        };


      } catch (error) {
        console.error("Failed to update user profile:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle specific Clerk errors
        if (error && typeof error === "object" && "status" in error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Failed to update profile in Clerk: ${error.status || "Unknown error"}`,
          });
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
      // Get active users from Sanity
      const sanityUsers = await client.fetch(
        groq`*[_type == "user" && status == "active"]{ _id, clerkUserId, email }`
      );

      if (!sanityUsers.length) return { deactivated: 0, cartsDeleted: 0 };

      const clerkUsers = await clerkClient.users.getUserList({
        limit: 500,
      });

      const clerkUserIds = new Set(clerkUsers.data.map((user) => user.id));

      // Find users that are active in Sanity but don't exist in Clerk
      const orphanedUsers = sanityUsers.filter(
        (sanityUser: any) => !clerkUserIds.has(sanityUser.clerkUserId)
      );

      if (!orphanedUsers.length) return { deactivated: 0, cartsDeleted: 0 };

      // Delete carts for orphaned users and deactivate users
      const operations = orphanedUsers.map(async (user: any) => {
        // Find and delete the user's cart
        const userCart = await client.fetch(
          groq`*[_type == "cart" && user._ref == $userId][0]`,
          { userId: user._id }
        );

        let cartDeleted = false;
        if (userCart) {
          await client.delete(userCart._id);
          cartDeleted = true;
        }

        // Deactivate the user
        await client
          .patch(user._id)
          .set({
            status: "deactivated",
            deactivatedAt: new Date().toISOString(),
            deactivationReason: "orphaned",
          })
          .commit();

        return { cartDeleted };
      });

      const results = await Promise.all(operations);
      const cartsDeleted = results.filter((r) => r.cartDeleted).length;

      return {
        deactivated: orphanedUsers.length,
        cartsDeleted: cartsDeleted,
        deactivatedUserIds: orphanedUsers.map((u: any) => u.clerkUserId),
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cleanup orphaned users",
      });
    }
  }),

  deactivateUserWebhook: baseProcedure
    .input(
      z.object({
        clerkUserId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const userToDeactivate = await client.fetch(
          groq`*[_type == "user" && clerkUserId == $clerkUserId][0]`,
          { clerkUserId: input.clerkUserId }
        );

        if (!userToDeactivate) {
          return { deactivated: false, message: "User not found in Sanity" };
        }

        // Find and delete the user's cart
        const userCart = await client.fetch(
          groq`*[_type == "cart" && user._ref == $userId][0]`,
          { userId: userToDeactivate._id }
        );

        let cartDeleted = false;
        if (userCart) {
          await client.delete(userCart._id);
          cartDeleted = true;
          console.log(
            `Deleted cart ${userCart._id} for deactivated user ${input.clerkUserId}`
          );
        }

        // Deactivate the user instead of deleting
        const deactivatedUser = await client
          .patch(userToDeactivate._id)
          .set({
            status: "deactivated",
            deactivatedAt: new Date().toISOString(),
            deactivationReason: "user_deleted",
          
          })
          .commit();

        return {
          deactivated: true,
          deactivatedId: userToDeactivate._id,
          cartDeleted: cartDeleted,
          user: deactivatedUser,
        };
      } catch (error) {
        console.error("Failed to deactivate user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to deactivate user",
        });
      }
    }),

  permanentlyDeleteDeactivatedUsers: baseProcedure
    .input(
      z.object({
        deactivatedBefore: z.string().datetime(), // ISO string
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Find users deactivated before a certain date
        const usersToDelete = await client.fetch(
          groq`*[_type == "user" && status == "deactivated" && _updatedAt < $date]`,
          { date: input.deactivatedBefore }
        );

        if (!usersToDelete.length) {
          return { deleted: 0 };
        }

        // Delete them permanently
        const deletePromises = usersToDelete.map((user: any) =>
          client.delete(user._id)
        );

        await Promise.all(deletePromises);

        return {
          deleted: usersToDelete.length,
          deletedUserIds: usersToDelete.map((u: any) => u.clerkUserId),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to permanently delete deactivated users",
        });
      }
    }),
});
