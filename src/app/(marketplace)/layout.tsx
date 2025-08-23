import type { Metadata} from "next";
import "../globals.css";
import Header from "@/features/layout/ui/components/header";
import { MegaMenuProvider } from "@/features/layout/ui/components/mega-menu-context";
import Footer from "@/features/layout/ui/components/footer";
import { SanityLive } from "@/sanity/lib/live";
import { CartSyncProvider } from "@/features/cart/hooks/cart-sync-context";

export const metadata: Metadata = {
  title:
    "Kampala Parents of Children with Disabilities Association – Makindye (KAPCDAM)",
  description:
    "KAPCDAM is a non-profit organization that provides support to children with disabilities and their families.",
  metadataBase: new URL("https://kapcdam.vercel.app"),
  openGraph: {
    title: "KAPCDAM",
    description:
      "KAPCDAM is a non-profit organization that provides support to children with disabilities and their families.",
    images: [
      {
        url: "https://res.cloudinary.com/teenkevo-cloud/image/upload/q_71/v1754259997/Home-OG_ykwsx2.webp",
      },
    ],
  },
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
        <SanityLive />
      </MegaMenuProvider>
 
  );
}
