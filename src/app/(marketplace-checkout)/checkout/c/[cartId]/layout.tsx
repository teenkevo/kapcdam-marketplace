import type { Metadata } from "next";
import "../../../../globals.css";
import { MegaMenuProvider } from "@/features/layout/ui/components/mega-menu-context";
import { SanityLive } from "@/sanity/lib/live";
import HeaderCheckout from "@/features/layout/ui/components/header-checkout";

export const metadata: Metadata = {
  title:
    "Kampala Parents of Children with Disabilities Association – Makindye (KAPCDAM)",
  description:
    "KAPCDAM is a non-profit organization that provides support to children with disabilities and their families.",
};

export default function MarketplaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MegaMenuProvider>
      <HeaderCheckout />
      <main className="bg-[#f2f2f2]">{children}</main>
      <SanityLive />
    </MegaMenuProvider>
  );
}
