import HeroSection from "@/features/home/ui/components/hero-section";
import AboutUsSummary from "../components/about-us-summary";
import Panel from "@/features/layout/ui/components/panel";
import { ProductList } from "@/components/product-list";

export default async function HomeView() {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <AboutUsSummary />
        <Panel />
        <ProductList />
      </main>
    </div>
  );
}
