"use client";

import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        {/* Simple Pot Illustration */}
        <div className="relative mx-auto w-32 h-32 mb-12">
          {/* Pot */}
          <div className="absolute bottom-0 w-32 h-20 bg-gray-900 rounded-b-3xl"></div>

          {/* Lid */}
          <div className="absolute top-8 w-32 h-6 bg-gray-700 rounded-full">
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-gray-900 rounded-full"></div>
          </div>

          {/* Simple Steam */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="w-1 h-6 bg-gray-300 rounded-full opacity-60 animate-pulse"></div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-6xl font-light text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-8">
          This page is still cooking. Check back later
        </p>

        <Button
          asChild
          variant="outline"
          className="border-gray-900 rounded-full text-gray-900 hover:bg-gray-900 hover:text-white"
        >
          <Link href="/" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
