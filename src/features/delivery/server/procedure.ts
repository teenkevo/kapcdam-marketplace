import { TRPCError } from "@trpc/server";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import {
  deliveryZoneSchema,
  getDeliveryZonesInput,
} from "../schemas/delivery-zone";
import { z } from "zod";

export const deliveryRouter = createTRPCRouter({
  // Get all active delivery zones
  getAllZones: baseProcedure.query(async () => {
    try {
      const zones = await client.fetch(
        groq`*[_type == "deliveryZone" && isActive == true] | order(fee asc)`
      );

      return zones.map((zone: any) => deliveryZoneSchema.parse(zone));
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch delivery zones",
      });
    }
  }),

  // Get delivery zones for a specific country
  getZonesByCountry: baseProcedure
    .input(
      z.object({
        country: z.string().default("Uganda"),
      })
    )
    .query(async ({ input }) => {
      try {
        // Fetch all active delivery zones in the country
        const query = groq`*[_type == "deliveryZone" && isActive == true && country == $country] | order(fee asc)`;

        const zones = await client.fetch(query, {
          country: input.country,
        });

        return zones.map((zone: any) => deliveryZoneSchema.parse(zone));
      } catch (error) {
        console.error("Error fetching delivery zones:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch delivery zones for country",
        });
      }
    }),

  // Get a specific delivery zone by ID
  getZoneById: baseProcedure
    .input(z.string())
    .query(async ({ input: zoneId }) => {
      try {
        const zone = await client.fetch(
          groq`*[_type == "deliveryZone" && _id == $zoneId][0]`,
          { zoneId }
        );

        if (!zone) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Delivery zone not found",
          });
        }

        return deliveryZoneSchema.parse(zone);
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch delivery zone",
        });
      }
    }),
});
