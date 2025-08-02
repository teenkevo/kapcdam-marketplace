import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ShopButton() {
  const [shopIsHovered, setShopIsHovered] = useState(false);

  return (
    <Link
      href={"/marketplace"}
      className={cn(
        buttonVariants({ size: "lg" }),
        "text-lime-400 w-32 border shadow-lg rounded-full border-lime-400"
      )}
      onMouseEnter={() => setShopIsHovered(true)}
      onMouseLeave={() => setShopIsHovered(false)}
    >
      Go to shop
      <motion.div
        animate={{
          x: shopIsHovered ? 5 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <ArrowRight className="h-5 w-5 text-white" />
      </motion.div>
    </Link>
  );
}
