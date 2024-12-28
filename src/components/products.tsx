import React from "react";
import Filters from "./filters";
import { ProductList } from "./product-list";

export default function Products() {
  return (
    <div className="flex">
      {/* Filters Component */}
      <aside className="w-1/4">
        <div className="sticky top-0">
          <Filters /> {/* Your existing Filters component */}
        </div>
      </aside>

      {/* Product List Component */}
      <main className="w-3/4">
        <ProductList /> {/* Your existing ProductList component */}
      </main>
    </div>
  );
}
