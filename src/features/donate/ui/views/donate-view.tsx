"use client";
import HeroSection from "@/features/donate/ui/components/hero-section";
import DonationCards from "@/features/donate/ui/components/donation-cards";
import SuccessStories from "@/features/donate/ui/components/success-stories";
import OtherWaysToSupport from "../components/other-ways-to-support";

export default function DonateView() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />
      <DonationCards />
      <SuccessStories />
      <OtherWaysToSupport />
    </div>
  );
}
