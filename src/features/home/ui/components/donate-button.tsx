"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HandHeart } from "lucide-react";
import { motion } from "framer-motion";


const DonateButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  const buttonContent = (
    <Button
      size="lg"
      className={`rounded-full w-32 shadow-lg ${
           
           "bg-lime-400 text-black hover:bg-lime-500"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      Donate
      <motion.div
        animate={{
          x: isHovered ? 5 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <HandHeart className={`h-10 w-10 text-black`} />
      </motion.div>
    </Button>
  );



  return (
    <Link href="/donate">
      {buttonContent}
    </Link>
  );
};

export default DonateButton;
