"use client";

import {
  Heart,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import ContactUsButton from "./contact-us-button";

function MarketplaceLinks() {
  const trpc = useTRPC();
  
  // Fetch categories from Sanity
  const { data: categories, isLoading } = useQuery(
    trpc.products.getCategories.queryOptions()
  );

  // Filter to get only parent categories (top 3)
  const parentCategories = categories?.filter(cat => !cat.hasParent || !cat.parent)?.slice(0, 3) || [];

  return (
    <div>
      <h4 className="font-bold text-gray-900 mb-4">OUR MARKETPLACE</h4>
      <ul className="space-y-2 text-sm">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <li key={i}>
              <div className="h-4 bg-gray-200 animate-pulse rounded w-32" />
            </li>
          ))
        ) : (
          parentCategories.map((category) => (
            <li key={category._id}>
              <Link
                href={`/marketplace?category=${category._id}`}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                {category.name}
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          {/* Left Column - Organization Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  <Link href="/" className="flex items-center space-x-2">
                    <Image
                      src="https://kapcdam.org/wp-content/uploads/2022/08/cropped-kapcdam-logo-2.jpg"
                      alt="KAPCDAM Logo"
                      width={280}
                      height={280}
                    />
                  </Link>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-700 mb-6">
                <p>P.O Box 14151</p>
                <p>Kampala, Uganda</p>
                <p>Tel: +256701115762 / +256(0)786953496</p>
                <p>info@kapcdam.org</p>
              </div>

              <ContactUsButton />

              <div className="space-y-3 text-sm text-gray-700 my-10">
                <div>
                  <p className="font-medium">KAPCDAM account number:</p>
                  <p>IBAN UG XX XXXX XXXX XXXX</p>
                  <p>BIC XXXXXXXX</p>
                </div>
                <div>
                  <p className="font-medium">KAPCDAM TIN Number:</p>
                  <p>UGXXXXXXXXXX</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  FOLLOW US VIA
                </h4>
                <div className="space-y-2">
                  <a
                    href="#"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                    <span className="text-sm">Facebook</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                    <span className="text-sm">Instagram</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span className="text-sm">LinkedIn</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    <span className="text-sm">Twitter</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Youtube className="w-4 h-4" />
                    <span className="text-sm">YouTube</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Columns - Links */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* About KAPCDAM */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4">ABOUT KAPCDAM</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Mission, values and vision
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Management team
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Our areas of action
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Job offers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Transparency and finance
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Our story
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Partner organizations
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Our impact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Annual reports
                  </a>
                </li>
              </ul>
            </div>

            {/* Join Us */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4">JOIN US</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Make a donation
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    KAPCDAM in your will
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Become a volunteer
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Fundraise for KAPCDAM
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Donate your belongings
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Shop with us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Corporate partnerships
                  </a>
                </li>
              </ul>
            </div>

            {/* Our Marketplace */}
            <MarketplaceLinks />

            {/* Read */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4">READ</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    KAPCDAM Uganda Annual Report
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    KAPCDAM Newsletters
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Impact stories
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Press releases
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Research reports
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="text-sm text-gray-600 max-w-4xl">
              <p>
                KAPCDAM works together with the parents of the Children with
                disabilities, their children, communities and partners, and
                strive for a just world, confronting the root causes of the
                challenges facing Children with disabilities. The organization
                empowers parents to sustain their children and demand for their
                rights.
              </p>
              <p className="mt-5">
                &copy; {new Date().getFullYear()} KAPCDAM Uganda. All rights
                reserved.
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <a
                href="#"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Privacy Policy
              </a>
              <span className="text-gray-400">/</span>
              <a
                href="#"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
