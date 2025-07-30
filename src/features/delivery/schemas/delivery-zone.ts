import { z } from "zod";

// Delivery zone schema for validation
export const deliveryZoneSchema = z.object({
  _id: z.string(),
  _type: z.literal("deliveryZone"),
  zoneName: z.string(),
  cities: z.array(z.string()),
  country: z.string(),
  fee: z.number().min(0),
  isActive: z.boolean(),
  estimatedDeliveryTime: z.string(),
  _createdAt: z.string().optional(),
  _updatedAt: z.string().optional(),
});

// Input schema for fetching zones by country
export const getDeliveryZonesInput = z.object({
  country: z.string().default("Uganda"),
});

// Types
export type DeliveryZone = z.infer<typeof deliveryZoneSchema>;
export type GetDeliveryZonesInput = z.infer<typeof getDeliveryZonesInput>;
