
import { useEffect } from "react";
import { ObjectInputProps, useFormValue, set } from "sanity";
import { useClient } from "sanity";

export function VariantFormComponent(props: ObjectInputProps) {
  const { renderDefault, onChange } = props;
  const client = useClient({ apiVersion: "2024-05-01" });

  const productRef = useFormValue(["product", "_ref"]) as string | undefined;
  const attributeValues = useFormValue(["attributeValues"]) as
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | any[]
    | undefined;
  const currentTitle = useFormValue(["title"]) as string | undefined;
  const currentSku = useFormValue(["sku"]) as string | undefined;

  useEffect(() => {
    if (!productRef || !attributeValues || attributeValues.length === 0) return;

    const generateVariantInfo = async () => {
      try {
        // Fetch product info and attribute names
        const product = await client.fetch(
          `*[_id == $productId][0]{ title, sku }`,
          { productId: productRef }
        );

     
        // Generate title
        const attrParts = attributeValues
          .filter((av) => av.attributeRef?._ref && av.value)
          .map((av) => {
         
            return av.value;
          })
          .filter(Boolean);

        const newTitle =
          attrParts.length > 0
            ? `${product?.title || "Product"} - ${attrParts.join(" / ")}`
            : `${product?.title || "Product"} Variant`;

        // Generate SKU
        const skuParts = attributeValues
          .filter((av) => av.attributeRef?._ref && av.value)
          .map((av) => av.value.toString().toUpperCase().substring(0, 3))
          .filter(Boolean);

        const baseSku = product?.sku || productRef.substring(0, 8);
        const newSku =
          skuParts.length > 0
            ? `${baseSku}-${skuParts.join("-")}`
            : `${baseSku}-VAR`;

        // Update only if changed
        const patches = [];
        if (newTitle !== currentTitle) {
          patches.push(set(newTitle, ["title"]));
        }
        if (newSku !== currentSku) {
          patches.push(set(newSku, ["sku"]));
        }

        if (patches.length > 0) {
          onChange(patches);
        }
      } catch (error) {
        console.error("Error generating variant info:", error);
      }
    };

    generateVariantInfo();
  }, [productRef, attributeValues, client, onChange, currentTitle, currentSku]);

  return renderDefault(props);
}
