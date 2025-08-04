import DonateView from "@/features/donate/ui/views/donate-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donate to KAPCDAM",
  description:
    "Support our work in providing support to children with disabilities and their families.",
  metadataBase: new URL("https://kapcdam.vercel.app"),
  openGraph: {
    title: "Donate to KAPCDAM",
    description:
      "Support our work in providing support to children with disabilities and their families.",
  },
};

export default function DonatePage() {
  return <DonateView />;
}
