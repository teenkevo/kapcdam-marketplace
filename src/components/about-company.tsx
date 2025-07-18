"use client";
import React, { useState } from "react";
import ProductCategoriesAbout from "./product-categories-about";
import Image from "next/image";
import { Barlow_Condensed } from "next/font/google";
import { Button } from "./ui/button";
import { ArrowRight, HandHeart } from "lucide-react";
import { motion } from "framer-motion";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: "600",
});

const AboutCompany: React.FC = () => {
  const [donateIsHovered, setDonateIsHovered] = useState(false);
  const [shopIsHovered, setShopIsHovered] = useState(false);

  return (
    <div className="relative w-full h-[40rem] overflow-hidden rounded-lg">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-right"
        style={{
          backgroundImage:
            "url('https://kapcdam.org/wp-content/uploads/2022/08/Candle-making-by-parents-of-Children-with-Disabilities-Association-1-1.jpg')",
        }}
      ></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent"></div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 space-y-10">
        <div>
          <p
            className={`text-6xl font-bold max-w-lg tracking-tight text-gray-300 mb-4 ${barlowCondensed.className}`}
          >
            BUILDING AN <span className="text-lime-400">INCLUSIVE FUTURE</span>{" "}
            FOR CHILDREN WITH DISABILITIES
          </p>
          <p className="text-sm font-light max-w-md text-gray-200 ">
            Owned by Kampala Parents of Children with Disabilities Association –
            Makindye (KAPCDAM)
          </p>
        </div>

        <div className="flex space-x-8">
          <Button
            size="lg"
            className="bg-lime-400 text-black hover:bg-lime-500 w-32 shadow-lg rounded-[6px]"
            onMouseEnter={() => setDonateIsHovered(true)}
            onMouseLeave={() => setDonateIsHovered(false)}
          >
            Donate
            <motion.div
              animate={{
                x: donateIsHovered ? 5 : 0,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <HandHeart className="h-10 w-10 text-black" />
            </motion.div>
          </Button>
          <Button
            size="lg"
            className="text-lime-400 w-32 border shadow-lg rounded-[6px] border-lime-400"
            onMouseEnter={() => setShopIsHovered(true)}
            onMouseLeave={() => setShopIsHovered(false)}
          >
            Shop Now
            <motion.div
              animate={{
                x: shopIsHovered ? 5 : 0,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <ArrowRight className="h-5 w-5 text-white" />
            </motion.div>
          </Button>
        </div>

        <ProductCategoriesAbout />
      </div>
    </div>
  );
};

export default AboutCompany;
