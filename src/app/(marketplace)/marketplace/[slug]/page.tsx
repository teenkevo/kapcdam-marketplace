import ProductView from "@/features/products/ui/views/product-view";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  return <ProductView slug={slug} />;
}