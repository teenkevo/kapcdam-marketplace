import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import { Context } from "./context";
import { auth } from "@clerk/nextjs/server";
import { getPesapalToken } from "@/modules/payments/server/util";

export const createTRPCContext = cache(async () => {
  return {
    auth: await auth(),
    pesapalToken: await getPesapalToken(),
  };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  // transformer: superjson,
});

const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      auth: ctx.auth,
    },
  });
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(isAuthed);
