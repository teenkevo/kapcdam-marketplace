import { useEffect } from "react";
import { ObjectInputProps, useFormValue, set, setIfMissing } from "sanity";

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

export function ProductFormComponent(props: ObjectInputProps) {
  const { renderDefault, onChange } = props;

  const title = useFormValue(["title"]) as string | undefined;
  const variants = useFormValue(["variants"]) as any[] | undefined;
  const slug = useFormValue(["slug"]) as { current?: string } | undefined;

  useEffect(() => {
    if (!title) return;

    // Generate slug if missing
    if (!slug?.current) {
      const slugValue = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      onChange(setIfMissing({ current: slugValue }, ["slug"]));
    }
  }, [title, slug, onChange]);

  useEffect(() => {
    if (!title || !variants || !Array.isArray(variants)) return;

    const baseSku = generateAcronym(title);
    const patches: any[] = [];

    variants.forEach((variant, index) => {
      if (!variant.attributes || !Array.isArray(variant.attributes)) return;

      const skuParts = variant.attributes
        .filter((attr: any) => attr.attributeRef?._ref && attr.value)
        .map((attr: any) => slugify(attr.value))
        .filter(Boolean);

      const expectedSku =
        skuParts.length > 0
          ? `${baseSku}-${skuParts.join("-")}`
          : `${baseSku}-VAR`;

      if (variant.sku !== expectedSku) {
        patches.push(set(expectedSku, ["variants", index, "sku"]));
      }
    });

    if (patches.length > 0) {
      onChange(patches);
    }
  }, [title, variants, onChange]);

  return renderDefault(props);
}
