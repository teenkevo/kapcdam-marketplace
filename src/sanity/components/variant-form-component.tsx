import { useEffect } from "react";
import { ObjectInputProps, useFormValue, set } from "sanity";
import { useClient } from "sanity";

const slugify = (text: string) => {
  if (!text) return "";
  return text
    .toString()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

const generateAcronym = (text: string) => {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
};

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
        const product = await client.fetch(`*[_id == $productId][0]{ title }`, {
          productId: productRef,
        });

    
        const attrParts = attributeValues
          .filter((av) => av.attributeRef?._ref && av.value)
          .map((av) => av.value)
          .filter(Boolean);

        const newTitle =
          attrParts.length > 0
            ? `${product?.title || "Product"} - ${attrParts.join(" / ")}`
            : `${product?.title || "Product"} Variant`;

        // 1. Generate a short acronym from the product's title.
        const baseSku = product?.title
          ? generateAcronym(product.title)
          : productRef.substring(0, 8);

        // 2. Generate parts from the full attribute values
        const skuParts = attributeValues
          .filter((av) => av.attributeRef?._ref && av.value)
          .map((av) => slugify(av.value))
          .filter(Boolean);

        // 3. Combine them into the final SKU
        const newSku =
          skuParts.length > 0
            ? `${baseSku}-${skuParts.join("-")}`
            : `${baseSku}-VAR`;

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
