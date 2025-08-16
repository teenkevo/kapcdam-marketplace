import HeroSectionWrapper from "@/features/home/ui/components/hero-section-wrapper";
import AboutUsSummary from "../components/about-us-summary";
import MarketPlaceTeaser from "@/features/home/ui/components/market-place-teaser";
import { ProductList } from "@/features/products/ui/components/product-list";
import { CoursesSection } from "../components/courses-section";

export default async function HomeView() {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSectionWrapper />
        <ProductList />
        <AboutUsSummary />
        <CoursesSection />
        <MarketPlaceTeaser />
      </main>
    </div>
  );
}
