import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { addressSchema } from "@/features/checkout/schemas/checkout-form";

// Address creation schema
export const createAddressSchema = addressSchema;

// Address update schema
export const updateAddressSchema = addressSchema.partial().extend({
  addressId: z.string(),
});

// Address response schema
export const addressResponseSchema = z.object({
  _id: z.string(),
  user: z.object({
    _ref: z.string(),
    _type: z.literal("reference"),
  }),
  label: z.enum(["home", "work", "other"]),
  fullName: z.string(),
  phone: z.string(),
  address: z.string(),
  landmark: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().default("Uganda"),
  deliveryInstructions: z.string().nullable().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const addressesRouter = createTRPCRouter({
  /**
   * Get user's addresses
   */
  getUserAddresses: protectedProcedure.query(async ({ ctx }) => {
    try {
      const addresses = await client.fetch(
        groq`*[_type == "address" && user->clerkUserId == $clerkUserId && isActive == true] | order(isDefault desc, updatedAt desc) {
          _id,
          user,
          label,
          fullName,
          phone,
          address,
          landmark,
          city,
          country,
          deliveryInstructions,
          isDefault,
          isActive,
          createdAt,
          updatedAt
        }`,
        { clerkUserId: ctx.auth.userId }
      );

      return addresses.map((addr: any) => addressResponseSchema.parse(addr));
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch addresses",
      });
    }
  }),

  /**
   * Get address by ID
   */
  getAddressById: protectedProcedure
    .input(z.object({ addressId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const address = await client.fetch(
          groq`*[_type == "address" && _id == $addressId && user->clerkUserId == $clerkUserId][0] {
            _id,
            user,
            label,
            fullName,
            phone,
            address,
            landmark,
            city,
            country,
            deliveryInstructions,
            isDefault,
            isActive,
            createdAt,
            updatedAt
          }`,
          { addressId: input.addressId, clerkUserId: ctx.auth.userId }
        );

        if (!address) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Address not found or access denied",
          });
        }

        return addressResponseSchema.parse(address);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch address",
        });
      }
    }),

  /**
   * Create new address
   */
  createAddress: protectedProcedure
    .input(createAddressSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get user reference
        const user = await client.fetch(
          groq`*[_type == "user" && clerkUserId == $clerkUserId][0]`,
          { clerkUserId: ctx.auth.userId }
        );

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // If this is set as default, remove default from other addresses
        if (input.isDefault) {
          await client
            .patch({
              query: groq`*[_type == "address" && user->clerkUserId == $clerkUserId && isDefault == true]`,
              params: { clerkUserId: ctx.auth.userId },
            })
            .set({ isDefault: false, updatedAt: new Date().toISOString() })
            .commit();
        }

        console.log("current user: ", user);

        // Create new address
        const newAddress = await client.create({
          _type: "address",
          user: { _type: "reference", _ref: user._id },
          ...input,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        });

        console.log("new Address: ", newAddress);

        return addressResponseSchema.parse({
          ...newAddress,
          user: { _ref: user._id, _type: "reference" },
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          console.log(error);
          throw error;
        }
        console.log("INTERNAL_SERVER_ERROR", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create address",
        });
      }
    }),

  /**
   * Update address
   */
  updateAddress: protectedProcedure
    .input(updateAddressSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { addressId, ...updateData } = input;

        // Verify address ownership
        const address = await client.fetch(
          groq`*[_type == "address" && _id == $addressId && user->clerkUserId == $clerkUserId][0]`,
          { addressId, clerkUserId: ctx.auth.userId }
        );

        if (!address) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Address not found or access denied",
          });
        }

        // If this is being set as default, remove default from other addresses
        if (updateData.isDefault) {
          await client
            .patch({
              query: groq`*[_type == "address" && user->clerkUserId == $clerkUserId && isDefault == true && _id != $addressId]`,
            })
            .set({ isDefault: false, updatedAt: new Date().toISOString() })
            .commit();
        }

        // Update the address
        const updatedAddress = await client
          .patch(addressId)
          .set({
            ...updateData,
            updatedAt: new Date().toISOString(),
          })
          .commit();

        return addressResponseSchema.parse({
          ...updatedAddress,
          user: address.user,
        });
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

  /**
   * Delete address (soft delete)
   */
  deleteAddress: protectedProcedure
    .input(z.object({ addressId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify address ownership
        const address = await client.fetch(
          groq`*[_type == "address" && _id == $addressId && user->clerkUserId == $clerkUserId][0]`,
          { addressId: input.addressId, clerkUserId: ctx.auth.userId }
        );

        if (!address) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Address not found or access denied",
          });
        }

        // Check if this is the only address
        const addressCount = await client.fetch(
          groq`count(*[_type == "address" && user->clerkUserId == $clerkUserId && isActive == true])`,
          { clerkUserId: ctx.auth.userId }
        );

        if (addressCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot delete the only address. Please add another address first.",
          });
        }

        // Soft delete the address
        const deletedAddress = await client
          .patch(input.addressId)
          .set({
            isActive: false,
            isDefault: false,
            updatedAt: new Date().toISOString(),
          })
          .commit();

        // If this was a default address, set another address as default
        if (address.isDefault) {
          const firstActiveAddress = await client.fetch(
            groq`*[_type == "address" && user->clerkUserId == $clerkUserId && isActive == true][0]`,
            { clerkUserId: ctx.auth.userId }
          );

          if (firstActiveAddress) {
            await client
              .patch(firstActiveAddress._id)
              .set({
                isDefault: true,
                updatedAt: new Date().toISOString(),
              })
              .commit();
          }
        }

        return { success: true, message: "Address deleted successfully" };
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

  /**
   * Set address as default
   */
  setDefaultAddress: protectedProcedure
    .input(z.object({ addressId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify address ownership
        const address = await client.fetch(
          groq`*[_type == "address" && _id == $addressId && user->clerkUserId == $clerkUserId && isActive == true][0]`,
          { addressId: input.addressId, clerkUserId: ctx.auth.userId }
        );

        if (!address) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Address not found or access denied",
          });
        }

        // Remove default from all other addresses
        await client
          .patch({
            query: groq`*[_type == "address" && user->clerkUserId == $clerkUserId && isDefault == true]`,
          })
          .set({ isDefault: false, updatedAt: new Date().toISOString() })
          .commit();

        // Set this address as default
        const updatedAddress = await client
          .patch(input.addressId)
          .set({
            isDefault: true,
            updatedAt: new Date().toISOString(),
          })
          .commit();

        return addressResponseSchema.parse({
          ...updatedAddress,
          user: address.user,
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to set default address",
        });
      }
    }),

  /**
   * Get default address
   */
  getDefaultAddress: protectedProcedure.query(async ({ ctx }) => {
    try {
      const defaultAddress = await client.fetch(
        groq`*[_type == "address" && user->clerkUserId == $clerkUserId && isActive == true && isDefault == true][0] {
          _id,
          user,
          label,
          fullName,
          phone,
          address,
          landmark,
          city,
          country,
          deliveryInstructions,
          isDefault,
          isActive,
          createdAt,
          updatedAt
        }`,
        { clerkUserId: ctx.auth.userId }
      );

      if (!defaultAddress) {
        return null;
      }

      return addressResponseSchema.parse(defaultAddress);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch default address",
      });
    }
  }),
});
