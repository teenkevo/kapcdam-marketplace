import { paymentsRouter } from "@/modules/payments/server/procedure";
import { createTRPCRouter, baseProcedure, protectedProcedure } from "../init";
import { productsRouter } from "@/modules/products/server/procedure";
import { userRouter } from "@/modules/auth/server/procedure";
import { donationsRouter } from "@/modules/donate/server/procedure";

export const appRouter = createTRPCRouter({
  products: productsRouter,
  payments: paymentsRouter,
  donations: donationsRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
