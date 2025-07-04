import React, { useCallback, useState } from "react";
import { Stack, Select, Card, Text, Flex, Button } from "@sanity/ui";
import { set } from "sanity";
import { useFormValue, ArrayOfObjectsInputProps } from "sanity";
import { TrashIcon } from "@sanity/icons";

type Variant = {
  _key: string;
  size?: string;
  color?: string;
  price?: number;
  inventory?: number;
  isActive?: boolean;
};

export function VariantSelectorInput(props: ArrayOfObjectsInputProps) {
  const { onChange, value = [] } = props;
  const [selectedVariantKey, setSelectedVariantKey] = useState<string>("");

  const variants = useFormValue(["variants"]) as Variant[] | undefined;

  const handleAddVariant = useCallback(() => {
    if (!selectedVariantKey) return;

    // Check if variant is already selected
    if (value.some((item) => item._key === selectedVariantKey)) {
      setSelectedVariantKey("");
      return;
    }

    const updatedSelection = [...value, { _key: selectedVariantKey }];
    onChange(set(updatedSelection));
    setSelectedVariantKey("");
  }, [selectedVariantKey, value, onChange]);

  // Handle removing a variant from the selection
  const handleRemoveVariant = useCallback(
    (variantKey: string) => {
      const updatedSelection = value.filter((item) => item._key !== variantKey);
      onChange(set(updatedSelection));
    },
    [value, onChange]
  );

  if (!variants || variants.length === 0) {
    return (
      <Card padding={3} radius={2} shadow={1} tone="primary">
        <Text>Define product variants first to select them here.</Text>
      </Card>
    );
  }

  const availableVariants = variants.filter(
    (variant) => !value.some((item) => item._key === variant._key)
  );

  const selectedVariants = variants.filter((variant) =>
    value.some((item) => item._key === variant._key)
  );

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} shadow={1}>
        <Stack space={3}>
          <Flex gap={2} align="center">
            <Select
              value={selectedVariantKey}
              onChange={(event) =>
                setSelectedVariantKey(event.currentTarget.value)
              }
              disabled={availableVariants.length === 0}
            >
              <option value="">
                {availableVariants.length === 0
                  ? "All variants selected"
                  : "Select a variant..."}
              </option>
              {availableVariants.map((variant) => {
                const variantName =
                  [variant.size, variant.color].filter(Boolean).join(" - ") ||
                  "Variant";
                const priceFormatted = variant.price
                  ? `(${variant.price.toLocaleString()} UGX)`
                  : "";
                const stockInfo =
                  variant.inventory !== undefined
                    ? `• Stock: ${variant.inventory}`
                    : "";

                return (
                  <option key={variant._key} value={variant._key}>
                    {variantName} {priceFormatted} {stockInfo}
                  </option>
                );
              })}
            </Select>
            <Button
              mode="default"
              tone="primary"
              text="Add"
              onClick={handleAddVariant}
              disabled={!selectedVariantKey}
            />
          </Flex>
          {selectedVariants.length > 0 && (
            <Stack space={2}>
              {selectedVariants.map((variant) => {
                const variantName =
                  [variant.size, variant.color].filter(Boolean).join(" - ") ||
                  "Variant";

                const statusInfo =
                  variant.isActive === false ? " (Inactive)" : "";

                return (
                  <Card
                    key={variant._key}
                    padding={3}
                    radius={2}
                    shadow={0}
                    tone="transparent"
                  >
                    <Flex justify="space-between" align="center">
                      <Text size={1} weight="medium">
                        {variantName}
                        {statusInfo}
                      </Text>

                      <Button
                        mode="bleed"
                        tone="critical"
                        icon={TrashIcon}
                        onClick={() => handleRemoveVariant(variant._key)}
                        title="Remove variant"
                      />
                    </Flex>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
