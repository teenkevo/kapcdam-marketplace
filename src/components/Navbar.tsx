"use client";
import Link from "next/link";
import Image from "next/image";
import {
  BadgePlus,
  Fingerprint,
  LogIn,
  Search,
  ShoppingCart,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ClerkLoaded,
  SignInButton,
  SignOutButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Input } from "./ui/input";
import ShoppingCartIcon from "./shopping-cart-icon";
import { UserNav } from "./user-nav";
import { Categories } from "./ui/categories";
import { LightDarkToggle } from "./light-dark-toggle";

const navItems = [
  {
    name: "Featured",
    link: "/",
  },
  {
    name: "New Arrivals",
    link: "/new-arrivals",
  },
  {
    name: "Special Offers",
    link: "/on-sale",
  },
];

const Navbar = () => {
  const { isSignedIn, user } = useUser();

  const pathname = usePathname();

  return (
    <>
      <header className="px-5 h-16 py-3 border-b border-gray-700 bg-black shadow-sm">
        <nav className="flex justify-between items-center h-full">
          <div className="flex space-x-10">
            <Link className="p-2 rounded-lg" href="/">
              <Image
                src="/kapcdam-store-logo.svg"
                alt="logo"
                width={150}
                height={30}
              />
            </Link>
            <div className="flex space-x-8">
              {navItems.map((navItem: any, idx: number) => (
                <Link
                  key={`link=${idx}`}
                  href={navItem.link}
                  className={cn("relative items-center flex space-x-1")}
                >
                  <span
                    className={cn(
                      "hidden sm:block text-white relative",
                      pathname === navItem.link &&
                        "font-semibold underline  decoration-white underline-offset-[25px]"
                    )}
                  >
                    {navItem.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <ClerkLoaded>
            <div className="flex items-center gap-5">
              {isSignedIn ? (
                <>
                  <Link href="/cart">
                    <ShoppingCartIcon itemCount={5} />
                  </Link>
                  <UserButton />
                  {/* <LightDarkToggle /> */}
                </>
              ) : (
                <>
                  <Link href="/cart">
                    <ShoppingCartIcon itemCount={5} />
                  </Link>
                  <SignInButton>
                    <Button className="border border-[#363639] bg-gradient-to-b from-[#39393F] to-[#222227] text-white shadow hover:border-white/60">
                      <LogIn size={20} strokeWidth={1.75} className="mr-2" />
                      Sign in
                    </Button>
                  </SignInButton>
                  <LightDarkToggle />
                </>
              )}
            </div>
          </ClerkLoaded>
        </nav>
      </header>
      <header className="px-5 h-16 py-3 border-b border-gray-700 bg-black drop-shadow-lg">
        <nav className="flex justify-between items-center h-full">
          <div className="flex space-x-10">
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products, categories, "
                className="w-full rounded-none bg-background pl-8 md:w-[400px]"
              />
            </div>
            <div className="flex space-x-8">
              <Categories />
              <p className="items-center flex text-white">
                🎁 🎄 Get 50% off selected items this CHRISTMAS
              </p>
              <Button className="text-lime-400">Shop Now</Button>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Navbar;
