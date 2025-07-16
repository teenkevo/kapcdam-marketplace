import React, { useState, useEffect } from "react";
import { Select, Card, Flex, Spinner, Text } from "@sanity/ui";
import { StringInputProps, useFormValue, set, unset } from "sanity";
import { useClient } from "sanity";
import useSWR from "swr";

type AttributeData = {
  allowedValues?: string[];
  categoryOverrideValues?: string[];
};

export function AttributeValueInput(props: StringInputProps) {
  const { onChange, value } = props;
  const client = useClient({ apiVersion: "2024-05-01" });

  const attributeRef = useFormValue(
    props.path.slice(0, -1).concat(["attributeRef", "_ref"])
  ) as string | undefined;

  const productPageCategoryRef = useFormValue(["category", "_ref"]) as
    | string
    | undefined;

  const [categoryRef, setCategoryRef] = useState<string | null>(null);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true);

  useEffect(() => {
    setIsLoadingCategory(true);
    if (productPageCategoryRef) {
      setCategoryRef(productPageCategoryRef);
      setIsLoadingCategory(false);
    } else {
      setIsLoadingCategory(false);
    }
  }, [productPageCategoryRef, client]);

  const fetcher = async (
    query: string,
    params: { attributeId: string; categoryId: string }
  ) => client.fetch<AttributeData>(query, params);

  const query = `
    *[_type == "attributeDefinition" && _id == $attributeId][0] {
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
