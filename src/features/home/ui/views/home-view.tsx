import HeroSection from "@/features/home/ui/components/hero-section";
import AboutUsSummary from "../components/about-us-summary";
import MarketPlaceTeaser from "@/features/home/ui/components/market-place-teaser";
import { ProductList } from "@/components/product-list";
import { CustomPaymentForm } from "@/components/pay-button";

export default async function HomeView() {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <CustomPaymentForm
          amount={500}
          currency="UGX"
          description="Test Payment - KAPCDAM"
          orderId={`TEST-${Date.now()}`}
          billingInfo={{
            email_address: "test@example.com",
            phone_number: "+256761074816",
            country_code: "UG",
            first_name: "Test",
            last_name: "User",
            line_1: "Kira",
          }}
        />
        <AboutUsSummary />
        <MarketPlaceTeaser />
        <ProductList />
      </main>
    </div>
  );
}
