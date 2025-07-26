import HeroSection from "@/features/home/ui/components/hero-section";
import AboutUsSummary from "../components/about-us-summary";
import MarketPlaceTeaser from "@/features/home/ui/components/market-place-teaser";
import { ProductList } from "@/components/product-list";
import { CustomPaymentForm } from "@/components/pay-button";
import { auth } from "@clerk/nextjs/server";

export default async function HomeView() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <AboutUsSummary />
        <MarketPlaceTeaser />
        <ProductList/>
      </main>
    </div>
  );
}
