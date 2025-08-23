import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/features/auth/lib/roles";
import HeroSection from "./hero-section";

export default async function HeroSectionWrapper() {
  const { userId } = await auth();
  const isAdmin = userId ? await isAdminUser() : false;

  return <HeroSection isAdmin={isAdmin} />;
}