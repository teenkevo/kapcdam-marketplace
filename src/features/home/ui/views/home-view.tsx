import HeroSection from "@/features/home/ui/components/hero-section";
import AboutUsSummary from "../components/about-us-summary";
import MarketPlaceTeaser from "@/features/home/ui/components/market-place-teaser";
import { ProductList } from "@/components/product-list";

export default async function HomeView() {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <AboutUsSummary />
        <MarketPlaceTeaser />
        <ProductList />
      </main>
    </div>
  );
}
