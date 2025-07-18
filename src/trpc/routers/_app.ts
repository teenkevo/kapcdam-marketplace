import { paymentsRouter } from "@/modules/payments/server/procedure";
import { createTRPCRouter, baseProcedure, protectedProcedure } from "../init";
import { productsRouter } from "@/modules/products/server/procedure";
import { userRouter } from "@/modules/auth/server/procedure";

export const appRouter = createTRPCRouter({
  products: productsRouter,
  payments: paymentsRouter,
  user: userRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
