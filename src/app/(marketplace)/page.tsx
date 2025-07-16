import OfferBanner from "@/components/offer-banner";
import { CustomPaymentForm } from "@/components/pay-button";
import { ProductList } from "@/components/product-list";
import Products from "@/components/products";
import { trpc } from "@/trpc/server";
import { Product } from "@/types";
import { SignInButton } from "@clerk/nextjs";

export default async function Marketplace() {
  const products = await trpc.products.getMany({});

  // console.log(orderResult.redirect_url);

  return (
    <>
      <div>
        {products.items.map((product) => (
          <span key={product._id}>{product?.title}</span>
        ))}
      </div>
      <SignInButton />
      <CustomPaymentForm
        amount={500}
        currency="UGX"
        description="Product purchase"
        orderId="ORDER-123"
        billingInfo={{
          email_address: "user@example.com",
          phone_number: "0761074816",
          country_code: "UG",
          first_name: "John",
          last_name: "Doe",
          line_1: "123 Main St",
        }}
      />
      {/* <OfferBanner />
      <Products /> */}
    </>
  );
}
