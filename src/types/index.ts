export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  rating: number;
  reviews: number;
  images: string[];
  seller: {
    name: string;
    verified: boolean;
  };
  category: string;
  inStock: boolean;
}

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
}
