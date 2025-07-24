import { ClerkProvider } from "@clerk/nextjs";
import { Roboto } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TRPCProvider } from "@/trpc/client";
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
  viewportFit: "cover",
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
            <Toaster position="top-right" />
            {children}
          </body>
        </html>
      </ClerkProvider>
    </TRPCProvider>
  );
}
