import { paymentsRouter } from "@/features/payments/server/procedure";
import { createTRPCRouter, protectedProcedure } from "../init";
import { productsRouter } from "@/features/products/server/procedure";
import { userRouter } from "@/features/auth/server/procedure";
import { adminUserRouter } from "@/features/auth/server/admin-procedure";
import { teamRouter } from "@/features/team/server/procedure";
import { donationsRouter } from "@/features/donate/server/procedure";
import { cartRouter } from "@/features/cart/server/procedure";
import { deliveryRouter } from "@/features/delivery/server/procedure";
import { couponRouter } from "@/features/coupons/server/procedure";
import { ordersRouter } from "@/features/orders/server/procedure";
import { adminOrdersRouter } from "@/features/orders/server/admin-procedure";
import { addressesRouter } from "@/features/addresses/server/procedure";
import { reviewsRouter } from "@/features/reviews/server/procedure";
import { coursesRouter } from "@/features/courses/server/procedure";

export const appRouter = createTRPCRouter({
  products: productsRouter,
  payments: paymentsRouter,
  donations: donationsRouter,
  user: userRouter,
  adminUser: adminUserRouter,
  team: teamRouter,
  cart: cartRouter,
  delivery: deliveryRouter,
  coupons: couponRouter,
  orders: ordersRouter,
  adminOrders: adminOrdersRouter,
  addresses: addressesRouter,
  reviews: reviewsRouter,
  courses: coursesRouter,
});

export type AppRouter = typeof appRouter;
