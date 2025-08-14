import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/features/auth/lib/roles";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Check if user is authenticated
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/admin/manage-orders");
  }

  // Check if user is an admin
  const adminUser = await getAdminUser();
  if (!adminUser) {
    redirect("/?error=unauthorized");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              <div className="ml-4 text-sm text-gray-500">
                Welcome, {adminUser.firstName} {adminUser.lastName}
                {adminUser.teamMember?.jobTitle && (
                  <span className="ml-2">• {adminUser.teamMember.jobTitle}</span>
                )}
              </div>
            </div>
            <nav className="flex space-x-8">
              <a
                href="/admin/manage-orders"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Manage Orders
              </a>
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