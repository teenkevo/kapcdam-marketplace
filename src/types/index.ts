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

// Global gtag types for Google Analytics
declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      config?: {
        send_to?: string;
        value?: number;
        currency?: string;
        transaction_id?: string;
        [key: string]: any;
      }
    ) => void;
  }
}
