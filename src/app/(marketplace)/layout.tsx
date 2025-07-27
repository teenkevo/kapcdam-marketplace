import type { Metadata, Viewport } from "next";
import "../globals.css";
import Header from "@/features/layout/ui/components/header";
import { MegaMenuProvider } from "@/features/layout/ui/components/mega-menu-context";
import Footer from "@/features/layout/ui/components/footer";

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
      <Header />
      <main>{children}</main>
      <Footer />
    </MegaMenuProvider>
  );
}
