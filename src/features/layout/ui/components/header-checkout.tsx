"use client";
import Link from "next/link";
import Image from "next/image";
import ShopButton from "@/features/home/ui/components/shop-button";
import { LockIcon } from "lucide-react";

export default function HeaderCheckout() {
  return (
    <header className="bg-[#c4f828] border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 lg:h-24">
          {/* Logo */}
          <div className="bg-white flex items-center gap-2 px-5 py-1 rounded-lg">
            <LockIcon className="w-3 h-3 md:w-5 md:h-5 text-black" />
            <h1 className="text-sm text-black md:text-lg font-bold">
              Secure Checkout
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <ShopButton />
          </div>
        </div>
      </div>
    </header>
  );
}
