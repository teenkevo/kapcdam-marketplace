import { Suspense } from "react";
import { ProductsView } from "@/features/products/ui/views/products-view";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsView />
    </Suspense>
  );
}
