"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { urlFor } from "@/sanity/lib/image";

export default function ProductCategoriesAbout() {
  const trpc = useTRPC();
  
  // Fetch categories from Sanity
  const { data: categories, isLoading, error } = useQuery(
    trpc.products.getCategories.queryOptions()
  );

  // Filter to get only parent categories (top 3)
  const parentCategories = categories?.filter(cat => !cat.hasParent || !cat.parent)?.slice(0, 3) || [];

  if (isLoading) {
    return (
      <section className="w-full mt-12">
        <div className="container">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden rounded-[15px] border-white">
                <CardContent className="p-0">
                  <div className="aspect-video relative p-2">
                    <div className="w-full h-full bg-gray-200 animate-pulse rounded-[12px]" />
                  </div>
                  <div className="py-2 px-2">
                    <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4 mx-auto" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !categories) {
    return (
      <section className="w-full mt-12">
        <div className="container">
          <div className="text-center py-8">
            <p className="text-gray-500">Failed to load categories</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full mt-12">
      <div className="container">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {parentCategories.map((category) => (
            <Card
              key={category._id}
              className="overflow-hidden rounded-[15px] border-white"
            >
              <Link href={`/marketplace?category=${category._id}`} className="group">
                <CardContent className="p-0">
                  <div className="aspect-video relative p-2">
                    <Image
                      src={
                        category.displayImage 
                          ? urlFor(category.displayImage).width(400).height(225).fit('crop').auto('format').url()
                          : "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      }
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.01] rounded-[12px]"
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
