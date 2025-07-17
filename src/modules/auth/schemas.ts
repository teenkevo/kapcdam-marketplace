import { Address, User } from "@root/sanity.types";
import z from "zod";

type addressTypeProjection = Pick<
  Address,
  "label" | "isDefault" | "phone" | "landmark" | "city" | "deliveryInstructions"
>;

type userTypeProjection = Pick<
  User,
  | "clerkUserId"
  | "firstName"
  | "lastName"
  | "phone"
  | "addresses"
  | "preferences"
>;

type userTypeWebhook = Pick<
  User,
  "clerkUserId" | "firstName" | "lastName" | "phone"|"email"
> & {
  eventType: "user.created" | "user.updated";
};

export const addressSchema = z.custom<addressTypeProjection>();
export const userProfileSchema = z.custom<userTypeProjection>();
export const userWebhookSchema = z.custom<userTypeWebhook>();
