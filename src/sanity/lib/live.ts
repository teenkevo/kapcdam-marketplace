import { defineLive } from "next-sanity";
import { client } from "./client";

const token = process.env.SANITY_READ_TOKEN;

if (!token) {
  throw new Error("Sanity token not found");
}


export const { sanityFetch, SanityLive } = defineLive({
  client: client.withConfig({
    apiVersion: "vX",
    token,
    perspective: "published",
    useCdn: false,
  }),
});
