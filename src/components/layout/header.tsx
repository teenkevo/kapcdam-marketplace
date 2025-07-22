"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import MegaMenu from "@/features/layout/ui/components/mega-menu";
import Image from "next/image";
import { SignInButton } from "@clerk/nextjs";
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
  TrendingDown,
  Lightbulb,
  MapPin,
} from "lucide-react";
import DonateButton from "@/features/home/ui/components/donate-button";
import { MainNavigation } from "./main-navigation";
import { useEffect, useState } from "react";

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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`py-4 sticky top-0 z-10 transition-colors ease-in-out duration-300 ${
        isScrolled ? "bg-dark" : ""
      }`}
    >
      <div className="w-full mx-auto px-4 max-w-[1440px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={"/logo/kapcdam-full-logo.svg"}
            alt="KAPCDAM Logo"
            height={300}
            width={300}
            className={"object-contain"}
          />
        </Link>
        <MainNavigation scrolled={false} />
        <Button size={"lg"} variant={isScrolled ? "secondary" : "default"}>
          Contact Us
        </Button>
      </div>
    </header>
  );
}
