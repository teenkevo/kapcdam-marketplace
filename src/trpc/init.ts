import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import { Context } from "./context";
import { auth } from "@clerk/nextjs/server";
import { getPesapalToken } from "@/features/payments/server/util";
import { getAdminUser } from "@/features/auth/lib/roles";

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

const isAdmin = t.middleware(async ({ next, ctx }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const adminUser = await getAdminUser();
  if (!adminUser) {
    throw new TRPCError({ 
      code: "FORBIDDEN",
      message: "Admin access required" 
    });
  }

  return next({
    ctx: {
      auth: ctx.auth,
      adminUser,
    },
  });
});

const isCustomer = t.middleware(async ({ next, ctx }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Check if user is an admin - if so, block access to customer features
  const adminUser = await getAdminUser();
  if (adminUser) {
    throw new TRPCError({ 
      code: "FORBIDDEN",
      message: "Customer-only feature. Admin users cannot access shopping cart, wishlist, or customer orders." 
    });
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
export const adminProcedure = baseProcedure.use(isAdmin);
export const customerProcedure = baseProcedure.use(isCustomer);
