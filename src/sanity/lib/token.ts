import "server-only";

export const serverToken = process.env.SANITY_READ_WRITE_TOKEN;
if (!serverToken) {
  throw new Error("Missing server token: SANITY_READ_WRITE_TOKEN");
}
