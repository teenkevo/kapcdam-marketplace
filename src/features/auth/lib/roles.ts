import { Roles } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";

export const checkRole = async (role: Roles) => {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role === role;
};

export const isAdmin = async () => {
  return await checkRole("admin");
};

// New function to check if user is admin using Sanity data
export const isAdminUser = async () => {
  const { userId } = await auth();
  
  if (!userId) return false;

  try {
    const adminTeamMember = await client.fetch(
      groq`*[_type == "team" && clerkId == $clerkId && role == "admin" && isActive == true][0]`,
      { clerkId: userId }
    );
    
    return !!adminTeamMember;
  } catch (error) {
    console.error("Error checking admin user:", error);
    return false;
  }
};

// Get admin user with details (with fallback to Clerk metadata)
export const getAdminUser = async () => {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) return null;

  try {
    // First, check for existing admin team member in Sanity
    const adminTeamMember = await client.fetch(
      groq`*[_type == "team" && clerkId == $clerkId && role == "admin" && isActive == true][0]`,
      { clerkId: userId }
    );
    
    if (adminTeamMember) {
      // Return in adminUser format for backward compatibility
      return {
        _id: adminTeamMember._id,
        _type: "adminUser", // Keep for backward compatibility
        clerkUserId: adminTeamMember.clerkId,
        email: adminTeamMember.email,
        firstName: adminTeamMember.name?.split(' ')[0] || '',
        lastName: adminTeamMember.name?.split(' ').slice(1).join(' ') || '',
        adminRole: adminTeamMember.adminRole,
        permissions: adminTeamMember.permissions,
        status: "active",
        lastLoginAt: adminTeamMember.lastLoginAt,
        teamMember: {
          _id: adminTeamMember._id,
          name: adminTeamMember.name,
          jobTitle: adminTeamMember.jobTitle,
          role: adminTeamMember.role
        }
      };
    }

    // Fallback: Check Clerk metadata if no admin user record exists
    const userRole = sessionClaims?.metadata?.role as string;
    
    if (userRole === "admin") {
      console.log(`Admin user found in Clerk metadata but not in Sanity for user: ${userId}`);
      
      // Return a temporary admin object to allow access
      // This should trigger the conversion process
      return {
        _id: `temp-admin-${userId}`,
        _type: "adminUser",
        clerkUserId: userId,
        email: sessionClaims?.email || "",
        firstName: sessionClaims?.given_name || "",
        lastName: sessionClaims?.family_name || "",
        adminRole: "admin",
        permissions: ["manage_orders"],
        status: "active",
        needsConversion: true, // Flag to indicate this is a temporary admin
        createdAt: new Date().toISOString(),
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching admin user:", error);
    
    // If database is down but user has admin metadata, allow access
    const userRole = sessionClaims?.metadata?.role as string;
    if (userRole === "admin") {
      console.warn("Database error but user has admin role in Clerk, allowing access");
      return {
        _id: `fallback-admin-${userId}`,
        _type: "adminUser",
        clerkUserId: userId,
        email: sessionClaims?.email || "",
        firstName: sessionClaims?.given_name || "",
        lastName: sessionClaims?.family_name || "",
        adminRole: "admin",
        permissions: ["manage_orders"],
        status: "active",
        isFallback: true,
        createdAt: new Date().toISOString(),
      };
    }
    
    return null;
  }
};
