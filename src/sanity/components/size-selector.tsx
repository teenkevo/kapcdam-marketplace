import React from "react";
import { Stack, Select, Text, Box, Spinner } from "@sanity/ui";
import { StringInputProps, useFormValue } from "sanity";
import { set, unset } from "sanity";
import useSWR from "swr";
import { useClient } from "sanity";
import { getSizeOptions } from "../lib/helpers";


type CategoryData = {
  categoryName?: string;
  sizeMapType?: string;
};

export function SizeInput(props: StringInputProps) {
  const { onChange, value } = props;

  const client = useClient({ apiVersion: "2025-07-05" });

  const categoryRef = useFormValue(["category", "_ref"]) as string | undefined;

  const fetcher = (query: string, params: { categoryId: string }) =>
    client.fetch<CategoryData>(query, params);

  const query = `
    *[_type == "product_category" && _id == $categoryId][0] {
      "categoryName": name,
      "sizeMapType": coalesce(sizeMapType, parentId->sizeMapType, 'none')
    }
  `;

  const { data, error, isLoading } = useSWR(
    categoryRef ? [query, { categoryId: categoryRef }] : null,
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

  if (!categoryRef) {
    return (
      <Stack space={2}>
        <Text muted size={1}>
          Size
        </Text>
        <Text size={2}>Please select a category first.</Text>
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

    </Stack>
  );
}
