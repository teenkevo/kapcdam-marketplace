"use client";
import Image from "next/image";
import { Barlow_Condensed } from "next/font/google";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { HandHeart, ArrowRight } from "lucide-react";
import { useState } from "react";
import DonationForm from "./donation-form";
import DonateButton from "./donate-button";
import ShopButton from "./shop-button";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: "600",
});

export default function HeroSection() {
  const [donateIsHovered, setDonateIsHovered] = useState(false);
  const [shopIsHovered, setShopIsHovered] = useState(false);

  return (
    <section className="relative min-h-[550px] bg-gradient-to-r from-teal-500 to-blue-500">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="https://kapcdam.org/wp-content/uploads/2022/08/Candle-making-by-parents-of-Children-with-Disabilities-Association-1-1.jpg"
          alt="Parents of children with disabilities making candles"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col justify-center px-4 md:px-8 space-y-10">
            {/* Hero Text */}
            <div>
              <p
                className={`text-6xl font-bold max-w-lg tracking-tight text-gray-300 mb-4 ${barlowCondensed.className}`}
              >
                BUILDING AN{" "}
                <span className="text-lime-400">INCLUSIVE FUTURE</span> FOR
                CHILDREN WITH DISABILITIES
              </p>
              <p className="text-sm font-light max-w-md text-gray-200 ">
                Owned by Kampala Parents of Children with Disabilities
                Association – Makindye (KAPCDAM)
              </p>
            </div>

            <div className="flex max-w-md flex-col space-y-4">
              <div className="flex space-x-8">
                <DonateButton />
                <ShopButton />
              </div>
              <h2 className="text-xs text-gray-300">
                Every purchase helps us provide care, resources, and hope to
                disabled children
              </h2>
            </div>
          </div>

          {/* Donation Form */}
          <div className="flex justify-center lg:justify-end">
            <DonationForm />
          </div>
        </div>
      </div>
    </section>
  );
}
