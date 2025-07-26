"use client";
import Image from "next/image";
import Link from "next/link";
import { Star, Heart, Minus, Plus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { products } from "@/features/products/ui/components/product-list";
import { ProductCard } from "@/features/products/ui/components/product-card";
import { useState } from "react";

export default function ProductPage() {
  const product = {
    id: "1",
    name: "Delight Dzanzi Dress",
    images: [
      "https://images.unsplash.com/photo-1664151100165-71ed5515adad?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://smesoko.com/wp-content/uploads/2023/08/1-7.jpg",
      "https://images.unsplash.com/photo-1664151100165-71ed5515adad?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1664151100165-71ed5515adad?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    description:
      "The Delight Dzanzi Dress features intricate patterns and vibrant colors inspired by traditional African designs. Made from high-quality cotton fabric, this dress combines comfort with stunning visual appeal.",
    price: 120,
    rating: 4,
    reviews: 50,
    category: "Fashion",
    inStock: true,
    seller: { name: "KAPCDAM", verified: true },
  };

  const [currentImage, setCurrentImage] = useState(product.images[0]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-8">
        <Link href="/" className="text-muted-foreground hover:text-primary">
          Home
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link
          href="/fashion"
          className="text-muted-foreground hover:text-primary"
        >
          Fashion
        </Link>
        <span className="text-muted-foreground">/</span>
        <span>{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-[16/10]">
            <img
              src={currentImage}
              alt={product.name}
              className="object-cover w-full h-full"
            />
            {!product.inStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold">Out of Stock</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-8 gap-4">
            {product.images.map((image, i) => (
              <button
                key={i}
                className="aspect-square relative rounded-lg overflow-hidden border-2 border-transparent hover:border-[#90D900] transition-colors"
                onClick={() => setCurrentImage(image)}
              >
                <img
                  src={image}
                  alt={`Product view ${i + 1}`}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < product.rating
                        ? "fill-yellow-400 stroke-yellow-400"
                        : "fill-gray-200 stroke-gray-200"
                    }`}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                  ({product.reviews} reviews)
                </span>
              </div>
              <Badge variant="secondary">{product.seller.name}</Badge>
            </div>
            <p className="text-2xl font-bold">UGX {product.price}</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Description</h3>
            <p className="text-muted-foreground">{product.description}</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Select Size</h3>
            <div className="flex gap-2">
              {["S", "M", "L", "XL"].map((size) => (
                <Button key={size} variant="outline" className="w-12 h-12">
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Quantity</h3>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon">
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-medium">1</span>
              <Button variant="outline" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-4">
            <Button className="flex-1 bg-[#90D900] hover:bg-[#7BC100] text-white">
              Add to Cart
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <Tabs defaultValue="details" className="mb-12">
        <TabsList>
          <TabsTrigger value="details">Product Details</TabsTrigger>
          <TabsTrigger value="shipping">Shipping Info</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-4">Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>100% Cotton fabric</li>
                    <li>Traditional African design</li>
                    <li>Hand-crafted details</li>
                    <li>Available in multiple sizes</li>
                    <li>Machine washable</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Size Guide</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Size</th>
                        <th className="text-left py-2">Bust</th>
                        <th className="text-left py-2">Waist</th>
                        <th className="text-left py-2">Hip</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">S</td>
                        <td className="py-2">86cm</td>
                        <td className="py-2">70cm</td>
                        <td className="py-2">94cm</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">M</td>
                        <td className="py-2">90cm</td>
                        <td className="py-2">74cm</td>
                        <td className="py-2">98cm</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">L</td>
                        <td className="py-2">94cm</td>
                        <td className="py-2">78cm</td>
                        <td className="py-2">102cm</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="shipping">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Delivery Information</h3>
                <p className="text-muted-foreground">
                  We offer standard shipping (5-7 business days) and express
                  shipping (2-3 business days) options. Free shipping is
                  available for orders over UGX 1000.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Returns Policy</h3>
                <p className="text-muted-foreground">
                  We accept returns within 30 days of delivery. Items must be
                  unused and in original packaging.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviews">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="border-b last:border-0 pb-6 last:pb-0"
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            className="w-4 h-4 fill-yellow-400 stroke-yellow-400"
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">Jane Doe</span>
                      <span className="text-sm text-muted-foreground">
                        2 weeks ago
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      Beautiful dress with amazing quality! The patterns are
                      stunning and the fit is perfect. Highly recommend this
                      piece to anyone looking for unique African fashion.
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      <div>
        <h2 className="text-2xl font-bold mb-6">You may also like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product, index) =>
            index < 4 ? <ProductCard key={index} product={product} /> : null
          )}
        </div>
      </div>
    </div>
  );
}
