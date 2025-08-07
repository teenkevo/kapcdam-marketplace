import HeroSection from "@/features/home/ui/components/hero-section";
import AboutUsSummary from "../components/about-us-summary";
import MarketPlaceTeaser from "@/features/home/ui/components/market-place-teaser";
import { ProductList } from "@/features/products/ui/components/product-list";
import { CoursesSection } from "../components/courses-section";
import { CleanupOrdersButton } from "@/components/dev/cleanup-orders-button";

import { auth } from "@clerk/nextjs/server";
import { CART_ITEMS_QUERY } from "@/features/cart/server/query";
import { sanityFetch } from "@/sanity/lib/live";
import { CartType } from "@/features/cart/schema";

export default async function HomeView() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <ProductList />
        <AboutUsSummary />
        <CoursesSection />
        <MarketPlaceTeaser />
      </main>
      
      {/* Development cleanup section - only shows in dev mode */}
      <div className="py-8 bg-gray-50 border-t">
        <div className="container mx-auto px-4">
          <CleanupOrdersButton />
        </div>
      </div>
    </div>
  );
}
