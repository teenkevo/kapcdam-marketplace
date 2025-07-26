import { paymentsRouter } from "@/modules/payments/server/procedure";
import { createTRPCRouter, protectedProcedure } from "../init";
import { productsRouter } from "@/modules/products/server/procedure";
import { userRouter } from "@/modules/auth/server/procedure";
import { donationsRouter } from "@/modules/donate/server/procedure";
import { cartRouter } from "@/modules/cart/server/procedure";
import { client } from "@/sanity/lib/client";
import { CART_ITEMS_QUERY } from "@/modules/cart/server/query";
import { CartSchema } from "@/modules/cart/schema";

export const appRouter = createTRPCRouter({
  products: productsRouter,
  payments: paymentsRouter,
  donations: donationsRouter,
  user: userRouter,
  cart: cartRouter,
});

export type AppRouter = typeof appRouter;
