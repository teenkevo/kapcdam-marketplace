import { Product } from "@/types";
import { ProductCard } from "./product-card";

export const products: Product[] = [
  {
    id: "1",
    name: "Delight Dzanzi Dress",
    images: [
      "https://images.unsplash.com/photo-1664151100165-71ed5515adad?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1664151100165-71ed5515adad?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1664151100165-71ed5515adad?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1664151100165-71ed5515adad?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 120000,
    rating: 4,
    reviews: 50,
    category: "Fashion",
    inStock: true,
    seller: { name: "KAPCDAM", verified: true },
  },
  {
    id: "2",
    name: "African Print Dress",
    images: [
      "https://images.unsplash.com/photo-1635147369839-f7b610513193?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1635147369839-f7b610513193?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1635147369839-f7b610513193?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1635147369839-f7b610513193?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 799000,
    rating: 5,
    reviews: 230,
    category: "Fashion",
    inStock: true,
    seller: { name: "KAPCDAM", verified: true },
  },
  {
    id: "3",
    name: "Bespoke Necklace",
    images: [
      "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 60000,
    rating: 3,
    reviews: 88,
    category: "Fashion",
    inStock: false,
    seller: { name: "KAPCDAM", verified: true },
  },
  {
    id: "4",
    name: "Nike Afro",
    images: [
      "https://images.unsplash.com/photo-1529810313688-44ea1c2d81d3?q=80&w=3041&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1529810313688-44ea1c2d81d3?q=80&w=3041&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1529810313688-44ea1c2d81d3?q=80&w=3041&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1529810313688-44ea1c2d81d3?q=80&w=3041&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 129900,
    rating: 4,
    reviews: 120,
    category: "Fashion",
    inStock: true,
    seller: { name: "KAPCDAM", verified: true },
  },
  {
    id: "5",
    name: "High heel shoes",
    images: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=2980&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=2980&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=2980&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=2980&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 45000,
    rating: 4,
    reviews: 32,
    category: "Fashion",
    inStock: true,
    seller: { name: "KAPCDAM", verified: true },
  },
  {
    id: "6",
    name: "Sculpture",
    images: [
      "https://images.unsplash.com/photo-1678724736817-c9f46d7e94b7?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1678724736817-c9f46d7e94b7?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1678724736817-c9f46d7e94b7?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1678724736817-c9f46d7e94b7?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 90000,
    rating: 5,
    reviews: 145,
    category: "Art and Craft",
    inStock: true,
    seller: { name: "KAPCDAM", verified: true },
  },
  {
    id: "7",
    name: "4 Patterned Cushions",
    images: [
      "https://images.unsplash.com/photo-1575277340599-43db25b63b6f?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1575277340599-43db25b63b6f?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1575277340599-43db25b63b6f?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1575277340599-43db25b63b6f?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 22000,
    rating: 3,
    reviews: 12,
    category: "Home Accessories",
    inStock: false,
    seller: { name: "KAPCDAM", verified: true },
  },
  {
    id: "8",
    name: "Chandelier",
    images: [
      "https://images.unsplash.com/photo-1688241319063-8668606f2fd1?q=80&w=2865&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1688241319063-8668606f2fd1?q=80&w=2865&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1688241319063-8668606f2fd1?q=80&w=2865&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1688241319063-8668606f2fd1?q=80&w=2865&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 150000,
    rating: 4,
    reviews: 67,
    category: "Home Acccessories",
    inStock: true,
    seller: { name: "KAPCDAM", verified: true },
  },
  {
    id: "9",
    name: "Ceramic Vases",
    images: [
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 499000,
    rating: 5,
    reviews: 92,
    category: "Home Accessories",
    inStock: true,
    seller: { name: "KAPCDAM", verified: false },
  },
  {
    id: "10",
    name: "Bathing Soap Tabs",
    images: [
      "https://images.unsplash.com/photo-1546552768-9e3a94b38a59?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1546552768-9e3a94b38a59?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1546552768-9e3a94b38a59?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1546552768-9e3a94b38a59?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 23000,
    rating: 5,
    reviews: 92,
    category: "Health & Wellness",
    inStock: true,
    seller: { name: "KAPCDAM", verified: false },
  },
  {
    id: "11",
    name: "Hotel Bathroom Kits",
    images: [
      "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 25000,
    rating: 5,
    reviews: 92,
    category: "Health & Wellness",
    inStock: true,
    seller: { name: "KAPCDAM", verified: false },
  },
  {
    id: "12",
    name: "Hand Wash Bottle",
    images: [
      "https://images.unsplash.com/photo-1705155726507-8e1b9119349b?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1705155726507-8e1b9119349b?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1705155726507-8e1b9119349b?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1705155726507-8e1b9119349b?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 25000,
    rating: 5,
    reviews: 92,
    category: "Health & Wellness",
    inStock: true,
    seller: { name: "KAPCDAM", verified: false },
  },
  {
    id: "13",
    name: "Book Collection",
    images: [
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2996&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2996&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2996&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2996&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 20000,
    rating: 5,
    reviews: 92,
    category: "Health & Wellness",
    inStock: true,
    seller: { name: "KAPCDAM", verified: false },
  },
  {
    id: "14",
    name: "Book Collection",
    images: [
      "https://images.unsplash.com/photo-1533031403683-9f53b30187bb?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1533031403683-9f53b30187bb?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1533031403683-9f53b30187bb?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1533031403683-9f53b30187bb?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 30000,
    rating: 5,
    reviews: 92,
    category: "Health & Wellness",
    inStock: true,
    seller: { name: "KAPCDAM", verified: false },
  },
  {
    id: "15",
    name: "Book Storage",
    images: [
      "https://images.unsplash.com/photo-1730169428740-5c7e65757fc4?q=80&w=2855&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1730169428740-5c7e65757fc4?q=80&w=2855&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1730169428740-5c7e65757fc4?q=80&w=2855&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1730169428740-5c7e65757fc4?q=80&w=2855&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 30000,
    rating: 5,
    reviews: 92,
    category: "Health & Wellness",
    inStock: true,
    seller: { name: "KAPCDAM", verified: false },
  },
];
export function ProductList() {
  return (
    <div className="px-8 py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-black">Products</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>
    </div>
  );
}
