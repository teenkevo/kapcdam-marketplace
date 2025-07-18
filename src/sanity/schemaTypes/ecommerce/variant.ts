import { defineType, defineField } from "sanity";
import { AttributeValueInput } from "@/sanity/components/attribute-value-input";
import { PriceInput } from "@/sanity/components/price-input";

export const productVariant = defineType({
  name: "productVariant",
  title: "Variant",
  type: "object",
  fields: [
    defineField({
      name: "sku",
      title: "SKU",
      type: "string",
      description: "Auto-generated from product and attributes",
      readOnly: true,
      hidden: true
    }),

    defineField({
      name: "attributes",
      title: "Attributes",
      type: "array",
      description: "Attribute-value pairs that define this variant",
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
                  // @ts-expect-error ref error expected
                  const categoryId = document?.category?._ref;
                  if (!categoryId) {
                    return { filter: "false" };
                  }
                  return {
                    filter: `_id in *[_type=="category" && _id==$categoryId][0].categoryAttributes[].attributeRef._ref`,
                    params: { categoryId },
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
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .custom((attributes) => {
            if (!attributes || !Array.isArray(attributes)) return true;

            const attributeRefs = attributes
              // @ts-expect-error sanity error expected
              .map((attr) => attr?.attributeRef?._ref)
              .filter(Boolean);

            const uniqueRefs = new Set(attributeRefs);

            if (attributeRefs.length !== uniqueRefs.size) {
              return "Each attribute can only be used once per variant.";
            }

            return true;
          }),
    }),

    defineField({
      name: "price",
      title: "Price",
      type: "string",
      components: {
        input: PriceInput,
      },
      validation: (Rule) =>
        Rule.required().custom((price) => {
          if (price && !/^\d*\.?\d*$/.test(price)) {
            return "Price must be a valid number.";
          }
          if (price && parseInt(price) < 0) {
            return "Price cannot be negative.";
          }
          return true;
        }),
    }),

    defineField({
      name: "totalStock",
      title: "Stock Quantity",
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
  // validation:(Rule) => Rule.custom((_,{document})=>{
  //   const variants = document?.variants as {sku?:string}[]

  //   const variantSkus = variants.map((v)=>v.sku)

  //   const uniqueSkus = new Set(variantSkus)

  //   if(variantSkus.length > uniqueSkus.size){
  //     return "Variants should not have the same attributes"
  //   }

  //   return true
  // }),

  preview: {
    select: {
      sku: "sku",
      attributes: "attributes",
      price: "price",
    },
    prepare({ sku, attributes, price }) {
      const attrValues = attributes
        ?.map((attr: { value: string }) => attr?.value)
        .filter(Boolean)
        .join(" / ");
      const priceDisplay = price ? `UGX ${price}` : "No price set";

      return {
        title: sku || "Variant",
        subtitle: `${attrValues} - ${priceDisplay}` || "No attributes",
      };
    },
  },
});
