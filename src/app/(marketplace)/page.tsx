import OfferBanner from "@/components/offer-banner";
import { ProductList } from "@/components/product-list";
import Products from "@/components/products";
import { Product } from "@/types";

export default function Marketplace() {
  return (
    <>
      <OfferBanner />
      <Products />
    </>
  );
}
