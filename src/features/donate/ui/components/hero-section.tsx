import { Shield, CheckCircle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Barlow_Condensed } from "next/font/google";
import Image from "next/image";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: "600",
});

export default function HeroSection() {
  return (
    <section className="relative h-[80vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="https://res.cloudinary.com/teenkevo-cloud/image/upload/q_68/v1753027739/annie-spratt-KBpIcWV6o2c-unsplash_qi3vr9.webp"
          alt="Parents of children with disabilities making candles"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r md:from-black/90 from-blue-800/50 md:via-blue-800/60 to-black/80"></div>

      {/* Hero Content */}
      <div className="relative z-10 flex pt-28 h-full text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2">
            <div className="max-w-2xl">
              <motion.div
                className="flex flex-col md:px-8 px-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1
                  className={`text-4xl md:text-6xl font-bold max-w-lg tracking-tight mb-4 ${barlowCondensed.className}`}
                >
                  YOU <span className="text-lime-400">+ </span> US{" "}
                  <span className="text-lime-400">= </span> REAL CHANGE
                </h1>
                <h2 className="text-base md:text-lg opacity-90 mb-8 leading-relaxed">
                  Every contribution directly supports disabled children in
                  Uganda through education, healthcare, and community
                  integration programs.
                </h2>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>100% Transparent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Direct Impact</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span>Tax Deductible</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
