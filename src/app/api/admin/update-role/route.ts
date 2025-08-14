import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: requestingUserId } = await auth();
    if (!requestingUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const requestingUser = await client.users.getUser(requestingUserId);
    
    // Check authorization
    if (requestingUser.publicMetadata?.adminRole !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, role, adminRole, permissions } = await req.json();

    // Update metadata and clear sync flag to force re-sync on next login
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role, // "admin" or null for regular users
        adminRole: role === "admin" ? adminRole : undefined,
        permissions: role === "admin" ? permissions : undefined,
        synced: false, // Force re-sync on next session
      },
    });

    return NextResponse.json({
      success: true,
      message: "Role updated. User will be synced on next login.",
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update role" },
      { status: 500 }
    );
  }
}

// Bulk reset sync flags (useful after system changes)
export async function PUT(req: NextRequest) {
  try {
    const { userId: requestingUserId } = await auth();
    if (!requestingUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const requestingUser = await client.users.getUser(requestingUserId);
    
    if (requestingUser.publicMetadata?.adminRole !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Reset all user sync flags
    const users = await client.users.getUserList({ limit: 500 });
    const updates = [];

    for (const user of users.data) {
      updates.push(
        client.users.updateUserMetadata(user.id, {
          publicMetadata: {
            ...user.publicMetadata,
            synced: false,
          },
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: `Reset sync flags for ${users.data.length} users`,
    });
  } catch (error) {
    console.error("Error resetting sync flags:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset" },
      { status: 500 }
    );
  }
}