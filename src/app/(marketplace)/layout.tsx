import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Roboto, Space_Grotesk } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "../globals.css";
import { TRPCProvider } from "@/trpc/client";
import Header from "@/features/layout/ui/components/header";
import { MegaMenuProvider } from "@/features/layout/ui/components/mega-menu-context";
import Footer from "@/features/layout/ui/components/footer";
import { Toaster } from "sonner";

const roboto = Roboto({
  weight: ["100", "300", "400", "700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "Kampala Parents of Children with Disabilities Association – Makindye (KAPCDAM)",
  description:
    "KAPCDAM is a non-profit organization that provides support to children with disabilities and their families.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Next .js already supports this field
  viewportFit: "cover",
  // `shrinkToFit` isn’t part of the spec anymore, so skip it
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
          <body className={roboto.className}>
            <MegaMenuProvider>
              <Toaster position="top-right" />
              <Header />
              <main>{children}</main>
              <Footer />
            </MegaMenuProvider>
          </body>
        </html>
      </ClerkProvider>
    </TRPCProvider>
  );
}
