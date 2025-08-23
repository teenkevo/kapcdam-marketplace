import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/features/auth/lib/roles";
import Link from "next/link";
import { GotToHomeButton } from "@/features/home/ui/components/shop-button";
import { UserNavButton } from "@/features/auth/ui/components/user-nav";
import Image from "next/image";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/admin/manage-orders");
  }

  const adminUser = await getAdminUser();
  if (!adminUser) {
    redirect("/?error=unauthorized");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <Image
                    src="https://res.cloudinary.com/teenkevo-cloud/image/upload/v1754117385/logo-kapcdam_h9goky.webp"
                    alt="KAPCDAM Logo"
                    width={280}
                    height={280}
                    className="w-auto h-20 md:h-12 object-contain"
                  />
                </Link>
              </div>
              <div className="ml-4 text-sm text-gray-500">
                Welcome, {adminUser.firstName} {adminUser.lastName}
                {adminUser.teamMember?.jobTitle && (
                  <span className="ml-2">
                    • {adminUser.teamMember.jobTitle}
                  </span>
                )}
              </div>
            </div>
            <nav className="flex space-x-8">
              <UserNavButton />
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
