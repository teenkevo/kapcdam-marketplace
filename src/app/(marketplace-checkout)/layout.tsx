import type { Metadata } from "next";

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
    <main className="bg-[#f2f2f2] min-h-screen flex flex-col">
      {" "}
      <HeaderCheckout />
      {children}
    </main>
  );
}
