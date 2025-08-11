import { RelatedProductsSection } from "./related-products-section";

interface RelatedProductsProps {
  productId: string;
  categoryId?: string;
}

export function RelatedProducts({
  productId,
  categoryId,
}: RelatedProductsProps) {
  return (
    <RelatedProductsSection
      productId={productId}
      categoryId={categoryId}
      title={categoryId ? "Related Products" : "You Might Also Like"}
      limit={4}
      className="px-4"
    />
  );
}
