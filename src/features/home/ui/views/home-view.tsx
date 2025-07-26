import HeroSection from "@/features/home/ui/components/hero-section";
import AboutUsSummary from "../components/about-us-summary";
import MarketPlaceTeaser from "@/features/home/ui/components/market-place-teaser";
import { ProductList } from "@/features/products/ui/components/product-list";

import { auth } from "@clerk/nextjs/server";
import { CART_ITEMS_QUERY } from "@/features/cart/server/query";
import { sanityFetch } from "@/sanity/lib/live";
import { CartType } from "@/features/cart/schema";
import { CartBubble } from "@/features/cart/ui/components/cart-bubble";

export default async function HomeView() {
  const { userId } = await auth();

  let cartData: CartType | null = null;
  if (userId) {
    const { data } = await sanityFetch({
      query: CART_ITEMS_QUERY,
      params: { clerkUserId: userId },
    });
    cartData = data;
  }

  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <AboutUsSummary />
        <MarketPlaceTeaser />
        <ProductList />
        <CartBubble totalItems={cartData?.itemCount ?? 0} />
      </main>
    </div>
  );
}
