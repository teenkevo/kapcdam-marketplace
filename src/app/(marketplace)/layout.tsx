import { ClerkProvider } from "@clerk/nextjs";
import { Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";
import "../globals.css";
import { TRPCProvider } from "@/trpc/client";
import Header from "@/components/layout/header";
import { MegaMenuProvider } from "@/features/layout/ui/components/mega-menu-context";
import Footer from "@/features/layout/ui/components/footer";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:
    "Kampala Parents of Children with Disabilities Association – Makindye (KAPCDAM)",
  description:
    "KAPCDAM is a non-profit organization that provides support to children with disabilities and their families.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TRPCProvider>
      <ClerkProvider dynamic>
        <html lang="en" suppressHydrationWarning>
          <body className={spaceGrotesk.className}>
           
              <Header />
              <main>{children}</main>
              <Footer />
          
          </body>
        </html>
      </ClerkProvider>
    </TRPCProvider>
  );
}
