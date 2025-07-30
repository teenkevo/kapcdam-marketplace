import { paymentsRouter } from "@/features/payments/server/procedure";
import { createTRPCRouter, protectedProcedure } from "../init";
import { productsRouter } from "@/features/products/server/procedure";
import { userRouter } from "@/features/auth/server/procedure";
import { donationsRouter } from "@/features/donate/server/procedure";
import { cartRouter } from "@/features/cart/server/procedure";
import { deliveryRouter } from "@/features/delivery/server/procedure";
import { couponRouter } from "@/features/coupons/server/procedure";
import { ordersRouter } from "@/features/orders/server/procedure";
import { addressesRouter } from "@/features/addresses/server/procedure";

export const appRouter = createTRPCRouter({
  products: productsRouter,
  payments: paymentsRouter,
  donations: donationsRouter,
  user: userRouter,
  cart: cartRouter,
  delivery: deliveryRouter,
  coupons: couponRouter,
  orders: ordersRouter,
  addresses: addressesRouter,
});

export type AppRouter = typeof appRouter;
