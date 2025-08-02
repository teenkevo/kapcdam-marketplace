import { Suspense } from "react";
import { ProductsView } from "@/features/products/ui/views/products-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products & Courses | KAPCDAM Marketplace",
  description: "Browse our collection of handcrafted products and skill-building courses from families with disabled children in Uganda. Support our community while finding unique items and learning opportunities.",
  keywords: ["products", "courses", "handcrafted", "Uganda", "disabled children", "marketplace", "training"],
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsView />
    </Suspense>
  );
}
