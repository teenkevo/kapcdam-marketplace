import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

export async function POST() {
  try {
    console.log("🧹 Starting order cleanup...");

    // Get all order and orderItem documents
    const [orders, orderItems] = await Promise.all([
      client.fetch(`*[_type == "order"]{ _id }`),
      client.fetch(`*[_type == "orderItem"]{ _id }`)
    ]);

    console.log(`Found ${orders.length} orders and ${orderItems.length} orderItems`);

    // Step 1: Clear orderItems arrays in all order documents first
    if (orders.length > 0) {
      console.log("🗑️ Clearing orderItems arrays from orders...");
      await Promise.all(
        orders.map((order: any) => 
          client.patch(order._id).set({ orderItems: [] }).commit()
        )
      );
      console.log(`✅ Cleared orderItems arrays from ${orders.length} orders`);
    }

    // Step 2: Delete all orderItem documents
    if (orderItems.length > 0) {
      console.log("🗑️ Deleting orderItem documents...");
      await Promise.all(orderItems.map((item: any) => client.delete(item._id)));
      console.log(`✅ Deleted ${orderItems.length} orderItems`);
    }

    // Step 3: Delete all order documents
    if (orders.length > 0) {
      console.log("🗑️ Deleting order documents...");
      await Promise.all(orders.map((order: any) => client.delete(order._id)));
      console.log(`✅ Deleted ${orders.length} orders`);
    }

    const total = orders.length + orderItems.length;
    console.log(`🎉 Deleted ${total} documents total`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${total} documents`,
      deleted: { orders: orders.length, orderItems: orderItems.length }
    });

  } catch (error) {
    console.error("Cleanup failed:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}