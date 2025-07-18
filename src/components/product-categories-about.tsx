import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const categories = [
  {
    name: "Handcrafted Goods",
    description: "Cutting-edge gadgets and devices",
    image:
      "https://images.unsplash.com/photo-1688241319063-8668606f2fd1?q=80&w=2865&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    href: "/category/electronics",
  },
  {
    name: "Essential Supplies",
    description: "Beautify your living space",
    image:
      "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    href: "/category/home-garden",
  },
  {
    name: "Skilling Center",
    description: "Trendy clothes and accessories",
    image:
      "https://kapcdam.org/wp-content/uploads/2022/08/Parents-of-CWDs-receiving-training.jpg",
    href: "/category/fashion",
  },
];

export default function ProductCategoriesAbout() {
  return (
    <section className="w-full mt-12">
      <div className="container">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {categories.map((category) => (
            <Card
              key={category.name}
              className="overflow-hidden rounded-[15px] border-white"
            >
              <Link href={category.href} className="group">
                <CardContent className="p-0">
                  <div className="aspect-video relative p-2">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-[1.01] rounded-[12px]"
                    />
                  </div>
                  <div className="py-2 px-2">
                    <h3 className="text-mg text-center font-semibold mb-1">
                      {category.name}
                    </h3>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
