"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HandHeart } from "lucide-react";
import { motion } from "framer-motion";

const DonateButton: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href="/donate">
      <Button
        size="lg"
        className="bg-lime-400 rounded-full text-black hover:bg-lime-500 w-32 shadow-lg"
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
          <HandHeart className="h-10 w-10 text-black" />
        </motion.div>
      </Button>
    </Link>
  );
};

export default DonateButton;
