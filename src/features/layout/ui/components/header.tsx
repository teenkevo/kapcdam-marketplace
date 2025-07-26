"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import MegaMenu from "@/features/layout/ui/components/mega-menu";
import Image from "next/image";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import {
  LogIn,
  DollarSign,
  Handshake,
  Users,
  Target,
  Sparkles,
  BookOpen,
  BarChart2,
  Eye,
  LinkIcon,
  Droplet,
  HeartPulse,
  Lightbulb,
} from "lucide-react";

import { CartNavButton } from "@/features/cart/ui/components/cart-nav-button";
import { CartSheet } from "@/features/cart/ui/components/cart-sheet";

// Define the data for the mega menus
const takeActionSections = [
  {
    heading: "Get Involved",
    items: [
      {
        title: "Donate Now",
        description: "Support our mission with a contribution.",
        href: "/donate",
        icon: DollarSign,
      },
      {
        title: "Start a Fundraiser",
        description: "Create your own campaign to raise awareness.",
        href: "/fundraise",
        icon: Handshake,
      },
      {
        title: "Volunteer",
        description: "Join our team on the ground or remotely.",
        href: "/volunteer",
        icon: Users,
      },
    ],
  },
  {
    heading: "Learn More",
    items: [
      {
        title: "Our Campaigns",
        description: "Discover current and past initiatives.",
        href: "/campaigns",
        icon: Target,
      },
      {
        title: "Success Stories",
        description: "Read about the impact of your support.",
        href: "/stories",
        icon: Sparkles,
      },
    ],
  },
];

const aboutUsSections = [
  {
    heading: "Who We Are",
    items: [
      {
        title: "Our Story",
        description: "Learn about our origins and mission.",
        href: "/about/story",
        icon: BookOpen,
      },
      {
        title: "Our Team",
        description: "Meet the dedicated individuals behind our work.",
        href: "/about/team",
        icon: Users,
      },
      {
        title: "Financials",
        description: "Transparency in our operations and spending.",
        href: "/about/financials",
        icon: BarChart2,
      },
    ],
  },
  {
    heading: "Our Values",
    items: [
      {
        title: "Vision & Mission",
        description: "Our long-term goals and daily purpose.",
        href: "/about/vision",
        icon: Eye,
      },
      {
        title: "Partnerships",
        description: "Collaborating for greater impact.",
        href: "/about/partnerships",
        icon: LinkIcon,
      },
    ],
  },
];

const whyKAPCDAMSections = [
  {
    heading: "Understanding the Challenge",
    items: [
      {
        title: "Facts & Figures",
        description: "Statistics and realities faced by disabled children.",
        href: "/why-disabled-children/facts",
        icon: Droplet, // Consider changing icon if you have a more relevant one
      },
      {
        title: "Health & Wellbeing",
        description: "Unique health needs and care for disabled children.",
        href: "/why-disabled-children/health",
        icon: HeartPulse,
      },
      {
        title: "Social Inclusion",
        description:
          "The importance of community and inclusion for disabled children.",
        href: "/why-disabled-children/inclusion",
        icon: Users,
      },
    ],
  },
  {
    heading: "Our Approach",
    items: [
      {
        title: "Support Programs",
        description: "How we support and empower disabled children.",
        href: "/why-disabled-children/support",
        icon: Lightbulb,
      },
      {
        title: "Success Stories",
        description: "Real-life impact and testimonials from families.",
        href: "/why-disabled-children/stories",
        icon: Sparkles,
      },
    ],
  },
];

export default function Header() {
  const user = useUser();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 lg:h-24">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="https://kapcdam.org/wp-content/uploads/2022/08/cropped-kapcdam-logo-2.jpg"
                alt="KAPCDAM Logo"
                width={280}
                height={280}
                className="w-32 h-20 md:w-48 md:h-12 lg:w-64 lg:h-16 xl:w-72 xl:h-24 object-contain"
              />
            </Link>
          </div>
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <MegaMenu label="Take Action" sections={takeActionSections} />
            <MegaMenu label="About Us" sections={aboutUsSections} />
            <MegaMenu label="Why KAPCDAM?" sections={whyKAPCDAMSections} />
          </nav>

          <div className="flex items-center space-x-4">
            {user.isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton>
                <Button variant="outline" className="rounded-full">
                  <LogIn size={20} strokeWidth={1.75} />
                </Button>
              </SignInButton>
            )}
            {/* Cart Components */}
            <CartSheet />
            <CartNavButton />
          </div>
        </div>
      </div>
    </header>
  );
}
