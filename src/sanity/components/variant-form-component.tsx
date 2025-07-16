import { useEffect } from "react";
import { ObjectInputProps, useFormValue, set } from "sanity";

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

export function VariantComponent(props: ObjectInputProps) {
  const { renderDefault, onChange } = props;


  const productTitle = useFormValue(["title"]) as string | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attributes = useFormValue(props.path.concat(["attributes"])) as | any[]| undefined;
  const currentTitle = useFormValue(props.path.concat(["title"])) as | string | undefined;
  const currentSku = useFormValue(props.path.concat(["sku"])) as | string | undefined;

  useEffect(() => {
    if (!productTitle || !attributes || attributes.length === 0) return;

    const generateVariantInfo = async () => {
      try {
        const attrParts = attributes
          .filter((attr) => attr.attributeRef?._ref && attr.value)
          .map((attr) => attr.value)
          .filter(Boolean);

        const newTitle =
          attrParts.length > 0
            ? `${productTitle} - ${attrParts.join(" / ")}`
            : `${productTitle} Variant`;

        const baseSku = generateAcronym(productTitle);

        const skuParts = attributes
          .filter((attr) => attr.attributeRef?._ref && attr.value)
          .map((attr) => slugify(attr.value))
          .filter(Boolean);

        const newSku =
          skuParts.length > 0
            ? `${baseSku}-${skuParts.join("-")}`
            : `${baseSku}-VAR`;

        const patches = [];
        if (newTitle !== currentTitle) {
          patches.push(set(newTitle, props.path.concat(["title"])));
        }
        if (newSku !== currentSku) {
          patches.push(set(newSku, props.path.concat(["sku"])));
        }

        if (patches.length > 0) {
          onChange(patches);
        }
      } catch (error) {
        console.error("Error generating variant info:", error);
      }
    };

    generateVariantInfo();
  }, [
    productTitle,
    attributes,
    onChange,
    currentTitle,
    currentSku,
    props.path,
  ]);

  return renderDefault(props);
}
