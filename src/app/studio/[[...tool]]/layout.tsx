import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio",
  description: "Edit your content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
