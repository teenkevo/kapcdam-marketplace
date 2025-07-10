import React, { useState, useEffect } from "react";
import { Select, TextInput, Card, Flex, Spinner, Text } from "@sanity/ui";
import { StringInputProps, useFormValue, set, unset } from "sanity";
import { useClient } from "sanity";
import useSWR from "swr";

type AttributeData = {
  dataType: "text" | "number" | "select" | "boolean";
  allowedValues?: string[];
  categoryOverrideValues?: string[];
};

export function AttributeValueInput(props: StringInputProps) {
  const { onChange, value, schemaType } = props;
  const client = useClient({ apiVersion: "2024-05-01" });


  const attributeRef = useFormValue(
    props.path.slice(0, -1).concat(["attributeRef", "_ref"])
  ) as string | undefined;

  // This is a direct reference if we are on the product page
  const productPageCategoryRef = useFormValue(["category", "_ref"]) as
    | string
    | undefined;
  // This is a reference to the product if we are on the variant page
  const variantPageProductRef = useFormValue(["product", "_ref"]) as
    | string
    | undefined;

  const [categoryRef, setCategoryRef] = useState<string | null>(null);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true);

  useEffect(() => {
    setIsLoadingCategory(true);
    if (productPageCategoryRef) {
      setCategoryRef(productPageCategoryRef);
      setIsLoadingCategory(false);
    } else if (variantPageProductRef) {
      // If we're in a variant, we need to fetch the parent product's category
      client
        .fetch<{
          categoryRef?: string;
        }>(`*[_id == $productId][0]{ "categoryRef": category._ref }`, { productId: variantPageProductRef })
        .then((result) => {
          if (result?.categoryRef) {
            setCategoryRef(result.categoryRef);
          }
          setIsLoadingCategory(false);
        });
    } else {
      setIsLoadingCategory(false);
    }
  }, [productPageCategoryRef, variantPageProductRef, client]);

  const fetcher = async (
    query: string,
    params: { attributeId: string; categoryId: string }
  ) => client.fetch<AttributeData>(query, params);

  const query = `
    *[_type == "attributeDefinition" && _id == $attributeId][0] {
      dataType,
      allowedValues,
      "categoryOverrideValues": *[_type == "category" && _id == $categoryId][0]
        .categoryAttributes[attributeRef._ref == $attributeId][0]
        .allowedValuesOverride
    }
  `;

  const {
    data,
    error,
    isLoading: isLoadingData,
  } = useSWR(
    attributeRef && categoryRef
      ? [query, { attributeId: attributeRef, categoryId: categoryRef }]
      : null,
    ([query, params]) => fetcher(query, params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );


  const handleSelectChange: React.FormEventHandler<HTMLSelectElement> = (
    event
  ) => {
    const newValue = event.currentTarget.value;
    onChange(newValue ? set(newValue) : unset());
  };

  const handleInputChange: React.FormEventHandler<HTMLInputElement> = (
    event
  ) => {
    const newValue = event.currentTarget.value;
    onChange(newValue ? set(newValue) : unset());
  };

  if (isLoadingCategory || isLoadingData) {
    return (
      <Card padding={3} border>
        <Flex justify="center" align="center">
          <Spinner muted />
        </Flex>
      </Card>
    );
  }

  if (!attributeRef) {
    return (
      <Card padding={2} tone="caution" border>
        <Text size={1}>Please select an attribute first</Text>
      </Card>
    );
  }

  if (error) {
    console.error("Error fetching attribute data:", error);
    return (
      <Card padding={2} tone="critical" border>
        <Text size={1}>Error loading attribute data</Text>
      </Card>
    );
  }

  const options = data?.categoryOverrideValues || data?.allowedValues || [];

  switch (data?.dataType) {
    case "select":
      if (options.length > 0) {
        return (
          <Select value={value || ""} onChange={handleSelectChange}>
            <option value="">Select a value</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        );
      }
      return (
        <TextInput
          value={value || ""}
          onChange={handleInputChange}
          placeholder="Enter a value"
        />
      );

    case "boolean":
      return (
        <Select value={value || ""} onChange={handleSelectChange}>
          <option value="">Select Yes/No</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </Select>
      );

    case "number":
      return (
        <TextInput
          type="number"
          value={value || ""}
          onChange={handleInputChange}
          placeholder="Enter a number"
        />
      );

    case "text":
    default:
      return (
        <TextInput
          value={value || ""}
          onChange={handleInputChange}
          placeholder={schemaType.placeholder || "Enter a value"}
        />
      );
  }
}
