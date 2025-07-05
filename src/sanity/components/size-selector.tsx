
import React from "react";
import { Stack, Select, Text, Box, Spinner } from "@sanity/ui";
import { StringInputProps, useFormValue } from "sanity";
import { set, unset } from "sanity";
import useSWR from "swr";
import { useClient } from "sanity";

const getSizeOptions = (sizeMapType: string): string[] => {
  const sizeMapTypes = {
    clothing_sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    general_sizes: ["Small", "Medium", "Large"],
    liquid_volumes: [
      "10ml",
      "50ml",
      "100ml",
      "250ml",
      "500ml",
      "1L",
      "2L",
      "5L",
      "10L",
    ],
    solid_weights: ["10g", "50g", "100g", "200g", "500g", "1kg", "2kg"],
    none: [],
  };
  return sizeMapTypes[sizeMapType as keyof typeof sizeMapTypes] || [];
};

type CategoryData = {
  categoryName?: string;
  sizeMapType?: string;
};

export function CategoryBasedSizeInput(props: StringInputProps) {
  const { onChange, value } = props;

  const client = useClient({ apiVersion: "2025-07-05" });

  const productRef = useFormValue(["product", "_ref"]) as string | undefined;

  const fetcher = (query: string, params: { productId: string }) =>
    client.fetch<CategoryData>(query, params);

  const query = `
    *[_type == "product" && _id == $productId][0] {
      "categoryName": category->name,
      "sizeMapType": coalesce(category->sizeMapType, category->parentId->sizeMapType, 'none')
    }
  `;

  const { data, error, isLoading } = useSWR(
    productRef ? [query, { productId: productRef }] : null,
    ([query, params]) => fetcher(query, params)
  );

  const sizeMapType = data?.sizeMapType;
  const sizeOptions = sizeMapType ? getSizeOptions(sizeMapType) : [];

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.currentTarget.value;
    onChange(newValue ? set(newValue) : unset());
  };

  if (isLoading) {
    return (
      <Stack space={2}>
        <Text muted size={1}>
          Size
        </Text>
        <Box>
          <Spinner />
        </Box>
      </Stack>
    );
  }

  if (!productRef) {
    return (
      <Stack space={2}>
        <Text muted size={1}>
          Size
        </Text>
        <Text size={2}>Please select a product first.</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack space={2}>
        <Text muted size={1}>
          Size
        </Text>
        <Text size={2}>Error fetching category info.</Text>
      </Stack>
    );
  }

  if (!sizeMapType || sizeMapType === "none" || sizeOptions.length === 0) {
    return (
      <Stack space={2}>
        <Text muted size={1}>
          Size
        </Text>
        <Text size={2}>
          No size options for the &quot;{data?.categoryName}&quot; category.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack space={2}>
      <Text muted size={1}>
        Size
      </Text>
      <Select
        value={value || ""}
        onChange={handleChange}
        placeholder="Select a size..."
      >
        {sizeOptions.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </Select>
      <Text muted size={1}>
        Using sizes from the &quot;{data?.categoryName}&quot; category.
      </Text>
    </Stack>
  );
}
