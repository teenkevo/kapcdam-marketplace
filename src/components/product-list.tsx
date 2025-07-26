
import { ProductCard } from "./product-card";
import { CartBubble } from "@/features/cart/ui/components/cart-bubble";
import { CartSheet } from "@/features/cart/ui/components/cart-sheet";
import { trpc } from "@/trpc/server";

export async function ProductList() {
  const data = await trpc.products.getMany({ page: 1, pageSize: 10 });
  if (!data) return null;

  return (
    <>
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
            Some of our products
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>

    
      <CartSheet />
      <CartBubble />
    </>
  );
}
