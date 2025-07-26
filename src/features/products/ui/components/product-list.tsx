import { ProductCard } from "./product-card";
import { CartBubble } from "@/features/cart/ui/components/cart-bubble";
import { trpc } from "@/trpc/server";
import { ProductListItem } from "../../schemas";
import { CART_ITEMS_QUERY } from "@/features/cart/server/query";
import { sanityFetch } from "@/sanity/lib/live";
import { CartType } from "@/features/cart/schema";
import { auth } from "@clerk/nextjs/server";

export async function ProductList() {
  const { userId } = await auth();

  const products = await trpc.products.getMany({ page: 1, pageSize: 10 });

  if (!products) return null;

   let cartData: CartType | null = null;
   if (userId) {
     const { data } = await sanityFetch({
       query: CART_ITEMS_QUERY,
       params: { clerkUserId: userId },
     });
     cartData = data;
   }

  return (
    <>
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
            Some of our products
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.items.map((product: ProductListItem) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>

      {/* <CartSheet /> */}
      <CartBubble totalItems={cartData?.itemCount ?? 0} />
    </>
  );
}
