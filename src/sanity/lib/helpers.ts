
// Helper function to get size options based on size type (for child categories only)

export const getSizeOptions = (sizeMapType: string): string[] => {
  const sizeMapTypes = {
    general_sizes: ["Small", "Medium", "Large", "Extra Large", "XXL"],
    volumes: [
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
    weights: ["10g", "50g", "100g", "200g", "500g", "1kg", "2kg"],
    none: [],
  };

  return sizeMapTypes[sizeMapType as keyof typeof sizeMapTypes] || [];
};
