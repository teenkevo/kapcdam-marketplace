import { User } from "@root/sanity.types";
import z from "zod";

type userTypeProjection = Pick<
  User,
  | "clerkUserId"
  | "firstName"
  | "lastName"
  | "phone"
  | "preferences"
>;

type userTypeWebhook = Pick<
  User,
  "clerkUserId" | "firstName" | "lastName" | "phone"|"email"
> & {
  eventType: "user.created" | "user.updated";
};

export const userProfileSchema = z.custom<userTypeProjection>();
export const userWebhookSchema = z.custom<userTypeWebhook>();
