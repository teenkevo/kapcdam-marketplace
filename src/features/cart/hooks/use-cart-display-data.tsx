// hooks/use-cart-display-data.ts
import { useMemo } from "react";
import { sanityFetch } from "@/sanity/lib/live";
import { groq } from "next-sanity";
import { CartType } from "@/features/cart/schema";

const CART_DISPLAY_QUERY = groq`
{
  "products": *[_type == "product" && _id in $productIds] {
    _id,
    title,
    price,
    hasVariants,
    totalStock,
    "defaultImage": images[isDefault == true][0],
    "variants": variants[] {
      sku,
      price,
      totalStock,
      isDefault,
      attributes[] {
        "id": attributeRef._ref,
        "name": attributeRef->name,
        "value": value
      }
    }
  },
  "courses": *[_type == "course" && _id in $courseIds] {
    _id,
    title,
    price,
    "defaultImage": images[0]
  }
}
`;

export function useCartDisplayData(cart: CartType | null) {
  // Extract unique IDs from cart items
  const { productIds, courseIds } = useMemo(() => {
    if (!cart?.cartItems) return { productIds: [], courseIds: [] };

    const productIds = cart.cartItems
      .filter((item) => item.type === "product" && item.productId)
      .map((item) => item.productId!)
      .filter((id, index, arr) => arr.indexOf(id) === index); // unique only

    const courseIds = cart.cartItems
      .filter((item) => item.type === "course" && item.courseId)
      .map((item) => item.courseId!)
      .filter((id, index, arr) => arr.indexOf(id) === index); // unique only

    return { productIds, courseIds };
  }, [cart?.cartItems]);

  // Fetch display data only when we have IDs
  const shouldFetch = productIds.length > 0 || courseIds.length > 0;

  const { data, loading, error } = sanityFetch(
    shouldFetch ? CART_DISPLAY_QUERY : null,
    { productIds, courseIds },
    {
      stale: false, // Always get fresh data for pricing
      perspective: "published",
    }
  );

  // Create lookup maps for easy access
  const displayData = useMemo(() => {
    if (!data) return { products: new Map(), courses: new Map() };

    const products = new Map(data.products?.map((p: any) => [p._id, p]) || []);
    const courses = new Map(data.courses?.map((c: any) => [c._id, c]) || []);

    return { products, courses };
  }, [data]);

  return {
    displayData,
    loading,
    error,
    hasData: shouldFetch && !!data,
  };
}
