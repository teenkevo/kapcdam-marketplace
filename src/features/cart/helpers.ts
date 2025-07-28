import { CartDisplayProductType, CartItemType } from "./schema";



export function getDisplayTitle(
  title: string,
  type: "product" | "course",
  selectedVariant?: {
    attributes: {
      name: string;
      value: string;
    }[];
  }
): string {
  if (!selectedVariant || type === "course") return title;

  const variantDetails = selectedVariant.attributes
    .map((attr) => `${attr.name}: ${attr.value}`)
    .filter(Boolean)
    .join(", ");

  return variantDetails ? `${title} - ${variantDetails}` : title;
}

export type ExpandedProduct = {
  _id: string;
  title: string;
  price: string;
  totalStock: string | null;
  defaultImage: any;
  hasVariants: boolean;
  isVariant: boolean;
  originalProductId: string;
  VariantSku?: string;
  attributes: Array<{
    name: string;
    value: string;
  }>;
};

/**
 * Expands products with variants into standalone items for cart display
 * - Products with variants become separate items for each variant in cart
 * - Products without variants remain as single items
 * - Generates Amazon-style titles for variants
 */
export function expandCartVariants(
  products: CartDisplayProductType[],
  cartItems: CartItemType[]
): ExpandedProduct[] {
  const expandedItems: ExpandedProduct[] = [];

  // Create a map of productId -> variant SKUs in cart
  const cartVariantsMap = new Map<string, string[]>();
  cartItems
    .filter(
      (item) =>
        item.type === "product" && item.productId && item.selectedVariantSku
    )
    .forEach((item) => {
      const productId = item.productId!;
      const sku = item.selectedVariantSku!;

      if (!cartVariantsMap.has(productId)) {
        cartVariantsMap.set(productId, []);
      }
      cartVariantsMap.get(productId)!.push(sku);
    });

  products.forEach((product) => {
    if (product.hasVariants && product.variants) {
      const cartVariantSkus = cartVariantsMap.get(product._id) || [];

      cartVariantSkus.forEach((sku) => {
        const variant = product.variants!.find((v) => v.sku === sku);
        if (!variant) return;

        const variantProduct: ExpandedProduct = {
          _id: `${product._id}-${variant.sku}`,
          title: getDisplayTitle(product.title, "product", variant),
          price: `${variant.price}`,
          totalStock: `${variant.totalStock}`,
          defaultImage: product.defaultImage,
          hasVariants: true,
          isVariant: true,
          originalProductId: product._id,
          VariantSku: variant.sku,
          attributes: variant.attributes,
        };

        expandedItems.push(variantProduct);
      });
      return;
    } else {
      // Product without variants - add as-is
      expandedItems.push({
        _id: product._id,
        title: product.title,
        price: product.price ?? "0",
        totalStock: `${product.totalStock}`,
        defaultImage: product.defaultImage,
        hasVariants: false,
        isVariant: false,
        originalProductId: product._id,
        attributes: [],
      });
    }
  });

  return expandedItems;
}
