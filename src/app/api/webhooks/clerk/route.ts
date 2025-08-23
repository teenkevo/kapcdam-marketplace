import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { trpc } from "@/trpc/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    // Handle session creation - smart sync on login
    if (evt.type === "session.created") {
      const { user_id } = evt.data;
      console.log("session.created", evt.data);
      
      const client = await clerkClient();
      const user = await client.users.getUser(user_id);
      console.log("user", user);
      
      const isAdmin = user.publicMetadata?.role === "admin";
      const isSynced = user.publicMetadata?.synced === true;
      
      // Skip if already synced
      if (isSynced) {
        return NextResponse.json({ status: "already_synced" });
      }
      
      if (isAdmin) {
        // Check if user exists in wrong collection
        const existingCustomer = await trpc.user.findByClerkId({
          clerkUserId: user_id,
        });
        
        if (existingCustomer) {
          // Delete cart and customer record
          await trpc.cart.deleteUserCart({ userId: existingCustomer._id });
          await trpc.user.deleteUser({ clerkUserId: user_id });
        }
        
        // Create/update admin as team member
        await trpc.team.syncAdminTeamMemberWebhook({
          eventType: "user.created",
          clerkUserId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          adminRole: (user.publicMetadata?.adminRole as string) || "admin",
          permissions: (user.publicMetadata?.permissions as string[]) || ["manage_orders"],
        });
      } else {
        // Check if user exists in admin team members
        const existingAdmin = await trpc.team.findAdminByClerkId({
          clerkUserId: user_id,
        });
        
        if (existingAdmin) {
          // Deactivate admin team member
          await trpc.team.deactivateAdminTeamMemberWebhook({
            clerkUserId: user_id,
          });
        }
        
        // Create/update regular user
        await trpc.user.syncUserWebhook({
          eventType: "user.created",
          clerkUserId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phone: user.phoneNumbers[0]?.phoneNumber,
        });
      }
      
      // Mark as synced
      await client.users.updateUserMetadata(user_id, {
        publicMetadata: {
          ...user.publicMetadata,
          synced: true,
        },
      });
      
      return NextResponse.json({ status: "synced" });
    }

    // Handle user creation - initial setup
    if (evt.type === "user.created") {
      const userData = evt.data;
      
      // Fetch fresh data to get any metadata set during signup
      const client = await clerkClient();
      const user = await client.users.getUser(userData.id);
      
      const isAdmin = user.publicMetadata?.role === "admin";
      
      if (isAdmin) {
        await trpc.team.syncAdminTeamMemberWebhook({
          eventType: "user.created",
          clerkUserId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          adminRole: (user.publicMetadata?.adminRole as string) || "admin",
          permissions: (user.publicMetadata?.permissions as string[]) || ["manage_orders"],
        });
      } else {
        await trpc.user.syncUserWebhook({
          eventType: "user.created",
          clerkUserId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phone: user.phoneNumbers[0]?.phoneNumber,
        });
      }
      
      // Mark as synced
      await client.users.updateUserMetadata(user.id, {
        publicMetadata: {
          ...user.publicMetadata,
          synced: true,
        },
      });
      
      return NextResponse.json({ status: "created" });
    }

    // Handle user updates
    if (evt.type === "user.updated") {
      const userData = evt.data;
      const isAdmin = userData.public_metadata?.role === "admin";
      
      // Clear synced flag when core data changes
      const client = await clerkClient();
      await client.users.updateUserMetadata(userData.id, {
        publicMetadata: {
          ...userData.public_metadata,
          synced: false,
        },
      });
      
      // Update whichever collection they're in
      if (isAdmin) {
        await trpc.team.syncAdminTeamMemberWebhook({
          eventType: "user.updated",
          clerkUserId: userData.id,
          email: userData.email_addresses[0]?.email_address || "",
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
          adminRole: (userData.public_metadata?.adminRole as string) || "admin",
          permissions: (userData.public_metadata?.permissions as string[]) || ["manage_orders"],
        });
      } else {
        await trpc.user.syncUserWebhook({
          eventType: "user.updated",
          clerkUserId: userData.id,
          email: userData.email_addresses[0]?.email_address || "",
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
          phone: userData.phone_numbers[0]?.phone_number,
        });
      }
      
      return NextResponse.json({ status: "updated" });
    }

    // Handle user deletion
    if (evt.type === "user.deleted") {
      if (!evt.data.id) {
        return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
      }

      const results = await Promise.allSettled([
        trpc.user.deactivateUserWebhook({
          clerkUserId: evt.data.id,
        }),
        trpc.team.deactivateAdminTeamMemberWebhook({
          clerkUserId: evt.data.id,
        }),
      ]);

      return NextResponse.json({ status: "deleted", results });
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}