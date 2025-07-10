
import React, { useState, useEffect } from "react";
import { TextInput } from "@sanity/ui";
import { StringInputProps, set, unset } from "sanity";

export function PriceInput(props: StringInputProps) {
  const { onChange, value = "" } = props;
  const [displayValue, setDisplayValue] = useState("");

  // Format number with commas
  const formatNumber = (num: string) => {
    const cleaned = num.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  useEffect(() => {
    if (value) {
      setDisplayValue(formatNumber(value));
    }
  }, [value]);

  const handleChange: React.FormEventHandler<HTMLInputElement> = (event) => {
    const inputValue = event.currentTarget.value;
    const rawValue = inputValue.replace(/[^\d.]/g, "");

    // Update display with formatted value
    setDisplayValue(formatNumber(rawValue));

    // Store raw numeric value
    onChange(rawValue ? set(rawValue) : unset());
  };

  return (
    <TextInput value={displayValue} onChange={handleChange} placeholder="0" />
  );
}
