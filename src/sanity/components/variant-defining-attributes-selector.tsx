/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-ignore


import { ArrayOfObjectsInputProps } from "sanity";

type AttributeItem = {
  _key: string;
  attributeRef?: {
    _type: "reference";
    _ref: string;
  };
  allowedValuesOverride?: string[];
};

export function UniqueAttributesInput(
  props: ArrayOfObjectsInputProps<AttributeItem>
) {
  const { renderDefault } = props;


  // Create the modified schema with dynamic filters
  const modifiedSchema = {
    ...props.schemaType,
    of: props.schemaType.of.map((memberType) => {
      // Find the attributeRef field in the object schema

      // @ts-expect-error
      const objectFields = memberType?.fields || [];
      const attributeRefFieldIndex = objectFields.findIndex(
        // @ts-expect-error
        (field) => field.name === "attributeRef"
      );

      if (attributeRefFieldIndex === -1) {
        return memberType;
      }

      // Clone the member type and modify the attributeRef field
      const modifiedFields = [...objectFields];
      const attributeRefField = modifiedFields[attributeRefFieldIndex];

      modifiedFields[attributeRefFieldIndex] = {
        ...attributeRefField,
        type: {
          ...attributeRefField.type,
          options: {
            ...attributeRefField.type.options,
            // @ts-expect-error
            filter: ({ document }) => {
              // Get the current value being edited
              const currentValue = document?.categoryAttributes || [];
              const usedRefs = currentValue
                // @ts-expect-error comment
                .filter((item) => item.attributeRef?._ref)
                // @ts-expect-error comment
                .map((item) => item.attributeRef._ref);

              return {
                filter: "!(_id in $usedRefs)",
                params: {
                  usedRefs: usedRefs,
                },
              };
            },
          },
        },
      };

      return {
        ...memberType,
        fields: modifiedFields,
      };
    }),
  };

  // Render the default array input with our modified schema
  return renderDefault({
    ...props,
    schemaType: modifiedSchema,
  });
}
