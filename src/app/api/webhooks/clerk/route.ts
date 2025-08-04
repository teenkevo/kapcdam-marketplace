import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { trpc } from "@/trpc/server";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created" || evt.type === "user.updated") {
      // Handle both user creation and updates with smart reactivation logic
      const result = await trpc.user.syncUserWebhook({
        eventType: evt.type,
        clerkUserId: evt.data.id,
        email: evt.data.email_addresses[0]?.email_address || "",
        firstName: evt.data.first_name || "",
        lastName: evt.data.last_name || "",
        phone: evt.data.phone_numbers[0]?.phone_number,
      });

      return NextResponse.json(result);
    }

    if (evt.type === "user.deleted") {
      if (!evt.data.id) {
        return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
      }

      // Deactivate user instead of deleting
      const result = await trpc.user.deactivateUserWebhook({
        clerkUserId: evt.data.id,
      });

      return NextResponse.json(result);
    }

    // Handle other webhook events if needed
    return NextResponse.json({
      status: "success",
      message: "Webhook processed",
    });
  } catch (error) {
    console.error("Webhook processing error:", error);

    // Return more specific error information for debugging
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
