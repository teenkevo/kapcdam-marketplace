import { paymentsRouter } from "@/features/payments/server/procedure";
import { createTRPCRouter, protectedProcedure } from "../init";
import { productsRouter } from "@/features/products/server/procedure";
import { userRouter } from "@/features/auth/server/procedure";
import { donationsRouter } from "@/features/donate/server/procedure";
import { cartRouter } from "@/features/cart/server/procedure";


export const appRouter = createTRPCRouter({
  products: productsRouter,
  payments: paymentsRouter,
  donations: donationsRouter,
  user: userRouter,
  cart: cartRouter,
});

export type AppRouter = typeof appRouter;
