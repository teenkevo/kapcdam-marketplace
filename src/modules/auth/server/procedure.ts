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
import {
  addressSchema,
  userProfileSchema,
  userWebhookSchema,
} from "../schemas";

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
            addresses: [],
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

        const defaultAddresses = input.addresses
          ? input.addresses.filter((addr) => addr.isDefault)
          : [];

        if (defaultAddresses.length !== 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Exactly one address must be marked as default",
          });
        }

        const updatedUser = await client
          .patch(currentUser._id)
          .set({
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            addresses: input.addresses,
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

  addAddress: protectedProcedure
    .input(addressSchema)
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

        const currentAddresses = currentUser.addresses || [];

        const updatedAddresses = input.isDefault
          ? currentAddresses.map((addr: any) => ({ ...addr, isDefault: false }))
          : currentAddresses;

        updatedAddresses.push({
          ...input,
        });

        const updatedUser = await client
          .patch(currentUser._id)
          .set({ addresses: updatedAddresses })
          .commit();

        return updatedUser;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add address",
        });
      }
    }),

  updateAddress: protectedProcedure
    .input(
      z.object({
        addressKey: z.string(),
        address: addressSchema,
      })
    )
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

        const currentAddresses = currentUser.addresses || [];
        const addressIndex = currentAddresses.findIndex(
          (addr: any) => addr._key === input.addressKey
        );

        if (addressIndex === -1) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Address not found",
          });
        }

        let updatedAddresses = [...currentAddresses];

        if (input.address.isDefault) {
          updatedAddresses = updatedAddresses.map((addr: any) =>
            addr._key === input.addressKey
              ? { ...addr, ...input.address }
              : { ...addr, isDefault: false }
          );
        } else {
          updatedAddresses[addressIndex] = {
            ...updatedAddresses[addressIndex],
            ...input.address,
          };
        }

        const updatedUser = await client
          .patch(currentUser._id)
          .set({ addresses: updatedAddresses })
          .commit();

        return updatedUser;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update address",
        });
      }
    }),

  deleteAddress: protectedProcedure
    .input(
      z.object({
        addressKey: z.string(),
      })
    )
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

        const currentAddresses = currentUser.addresses || [];
        const addressToDelete = currentAddresses.find(
          (addr: any) => addr._key === input.addressKey
        );

        if (!addressToDelete) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Address not found",
          });
        }

        if (addressToDelete.isDefault && currentAddresses.length > 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot delete default address. Set another address as default first.",
          });
        }

        const updatedAddresses = currentAddresses.filter(
          (addr: any) => addr._key !== input.addressKey
        );

        const updatedUser = await client
          .patch(currentUser._id)
          .set({ addresses: updatedAddresses })
          .commit();

        return updatedUser;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete address",
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
