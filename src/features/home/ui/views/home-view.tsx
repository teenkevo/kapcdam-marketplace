import HeroSection from "@/features/home/ui/components/hero-section";
import AboutUsSummary from "../components/about-us-summary";

export default async function HomeView() {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <AboutUsSummary />
      </main>
    </div>
  );
}
