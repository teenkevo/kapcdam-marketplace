import { ClerkProvider } from "@clerk/nextjs";
import { Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";
import "../globals.css";
import Navbar from "@/components/Navbar";
import { TRPCProvider } from "@/trpc/client";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KAPCDAM Marketplace",
  description: "Shop now and enjoy huge savings with KAPCDAM's deals",
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
            {/* <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          > */}
            <main>
              <Navbar />
              {children}
            </main>
            {/* </ThemeProvider> */}
          </body>
        </html>
      </ClerkProvider>
    </TRPCProvider>
  );
}
