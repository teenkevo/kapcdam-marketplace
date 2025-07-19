"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { HandHeart, Mail } from "lucide-react";
import { motion } from "framer-motion";

const ContactUsButton: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button className="border rounded-full border-[#363639] bg-gradient-to-b from-[#39393F] to-[#222227] text-white shadow hover:border-white/60">
      Contact us
    </Button>
  );
};

export default ContactUsButton;
