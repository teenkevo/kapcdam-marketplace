import { defineType, defineField } from "sanity";
import { AttributeValueInput } from "@/sanity/components/attribute-value-input";
import { VariantFormComponent } from "@/sanity/components/variant-form-component";
import { PriceInput } from "@/sanity/components/price-input";

export const productVariant = defineType({
  name: "productVariant",
  title: "Product Variant",
  type: "document",
  components: {
    input: VariantFormComponent,
  },
  validation: (Rule) =>
    Rule.custom(async (doc, context) => {
      const { getClient } = context;
      // @ts-expect-error sanity typescript _ref error
      if (!doc || !doc.product?._ref || !Array.isArray(doc.attributeValues)) {
        return true;
      }

      if (!doc._id) {
        return true;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentSignature = (doc.attributeValues as any[])

        .map((attr) => `${attr.attributeRef._ref}:${attr.value}`)
        .sort()
        .join(";");

      const client = getClient({ apiVersion: "2024-05-01" });
      
      // We need to exclude both the draft and the published version of this document.
      const publishedId = doc._id.replace("drafts.", "");
      const draftId = `drafts.${publishedId}`;

      const query = `*[_type == "productVariant" && !(_id in [$publishedId, $draftId]) && product._ref == $productId]`;
      const params = {
        publishedId,
        draftId,
        // @ts-expect-error Sanity's type for the document in context can be incomplete
        productId: doc.product._ref,
      };

      const otherVariants = await client.fetch(query, params);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasDuplicate = otherVariants.some((variant: any) => {
        if (!Array.isArray(variant.attributeValues)) return false;
        const variantSignature = variant.attributeValues
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((attr: any) => `${attr.attributeRef._ref}:${attr.value}`)
          .sort()
          .join(";");
        return variantSignature === currentSignature;
      });

      if (hasDuplicate) {
        return "A variant with these exact attribute values already exists.";
      }

      return true;
    }),
  fields: [
    defineField({
      name: "title",
      title: "Variant Title",
      type: "string",
      description: "Auto-generated from product and attributes",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "product",
      title: "Product",
      type: "reference",
      to: [{ type: "product" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "attributeValues",
      title: "Attribute Values",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "attributeRef",
              title: "Attribute",
              type: "reference",
              to: [{ type: "attributeDefinition" }],
              options: {
                filter: ({ document }) => {
                  //   eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const productId = (document as any).product?._ref;
                  if (!productId) {
                    return { filter: "false" };
                  }
                  return {
                    filter: `_id in *[_type=="product" && _id==$productId][0].variantDefiningAttributes[]._ref`,
                    params: { productId },
                  };
                },
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "value",
              title: "Value",
              type: "string",
              components: {
                input: AttributeValueInput,
              },
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: "attributeRef.name",
              subtitle: "value",
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      components: {
        input: PriceInput,
      },
      validation: (Rule) =>
        Rule.custom((price) => {
          if (typeof price === "undefined") return true;
          if (!/^\d*\.?\d*$/.test(price))
            return "Price must be a valid number.";
          if (parseInt(price) < 0) return "Price cannot be negative.";
          return true;
        }).required(),
    }),
    defineField({
      name: "originalPrice",
      title: "Original Price",
      type: "string",
      description: "The price before a sale or discount. Optional.",
      components: {
        input: PriceInput,
      },
      validation: (Rule) =>
        Rule.custom((price) => {
          if (typeof price === "undefined" || price === "") return true;
          if (!/^\d*\.?\d*$/.test(price))
            return "Price must be a valid number.";
          if (parseInt(price) < 0) return "Price cannot be negative.";
          return true;
        }),
    }),
    defineField({
      name: "sku",
      title: "SKU",
      type: "string",
      description: "Auto-generated from product SKU and attributes",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "totalStock",
      title: "Total Stock",
      type: "number",
      initialValue: 0,
      validation: (Rule) => Rule.required().min(0).integer(),
    }),
    defineField({
      name: "isDefault",
      title: "Default Variant",
      type: "boolean",
      description:
        "Set this as the main variant to display on the product page.",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "title",
      sku: "sku",
      media: "images.0",
    },
    prepare({ title,sku, media }) {
      return {
        title,
        subtitle: `SKU: ${sku || "N/A"}`,
        media: media,
      };
    },
  },
  initialValue: async (params, context) => {
    // Guard against undefined product reference
    if (!params.product?._ref) {
      return {
        product: params.product,
        title: "New Variant",
        sku: `VAR-${Date.now()}`,
      };
    }

    const { getClient } = context;
    const client = getClient({ apiVersion: "2024-05-01" });

    try {
      const product = await client.fetch(`*[_id == $id][0]{ title, sku }`, {
        id: params.product._ref,
      });

      // Generate a unique SKU
      const timestamp = Date.now();
      const baseSku = product?.sku || product?._id || "VAR";
      const generatedSku = `${baseSku}-${timestamp}`;

      return {
        product: params.product,
        title: product?.title ? `${product.title} Variant` : "New Variant",
        sku: generatedSku,
      };
    } catch (error) {
      console.error("Error fetching product:", error);
      return {
        product: params.product,
        title: "New Variant",
        sku: `VAR-${Date.now()}`,
      };
    }
  },
});
