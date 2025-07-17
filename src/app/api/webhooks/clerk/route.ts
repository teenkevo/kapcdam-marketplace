import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { trpc } from "@/trpc/server";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created" || evt.type === "user.updated") {

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

      const result = await trpc.user.deleteUserWebhook({
        clerkUserId: evt.data.id,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ status: 200 });
  } catch (error) {
    return NextResponse.json({ status: 500 });
  }
}
