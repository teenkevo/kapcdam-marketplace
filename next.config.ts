import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // TODO: Remove this once we have a proper image CDN
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kapcdam.org",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
