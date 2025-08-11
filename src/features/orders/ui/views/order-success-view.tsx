"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ReceiptTextIcon } from "lucide-react";
import type { OrderResponse } from "@/features/orders/schema";

interface OrderSuccessViewProps {
  orderId: string;
}

export default function OrderSuccessView({ orderId }: OrderSuccessViewProps) {
  const trpc = useTRPC();
  const router = useRouter();

  // Fetch order details
  const { data: order, isLoading: isOrderLoading } = useQuery(
    trpc.orders.getOrderById.queryOptions({ orderId })
  );

  if (isOrderLoading) {
    return (
      <div className="max-w-xl mx-auto py-10 md:py-20">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5F82A] mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Loading order…</h3>
          <p className="text-gray-600">
            Please wait while we fetch your order details.
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-10 md:py-20">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Order not found</h1>
          <p className="text-gray-600 mb-6">
            The order you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <Button
            onClick={() => router.push("/marketplace")}
            className="px-6 py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625]"
          >
            Continue shopping
          </Button>
        </div>
      </div>
    );
  }

  const typedOrder = order as OrderResponse;
  const isPaid = typedOrder.paymentStatus === "paid";
  const isCOD = typedOrder.paymentMethod === "cod";

  const formattedTotal = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  })
    .format(typedOrder.total)
    // Ensure we keep "UGX" prefix and remove any trailing decimal separators if locale differs
    .replace("UGX", "UGX");

  return (
    <div className="max-w-xl mx-auto py-10 md:py-20">
      <div className="bg-white rounded-xl shadow-sm max-w-md mx-auto border-2 p-8 text-center border-dashed">
        <div className="flex justify-center mb-6">
          <ReceiptTextIcon className="w-14 h-14 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">
          {isPaid
            ? "Payment successful!"
            : isCOD
              ? "Order confirmed!"
              : "Order created!"}
        </h1>
        <p className="text-gray-700 mt-2">
          {isPaid && !isCOD ? (
            <>
              We've received{" "}
              <span className="font-semibold">{formattedTotal}</span> for order{" "}
              <span className="font-semibold">#{typedOrder.orderNumber}</span>.
            </>
          ) : isCOD ? (
            <>
              Your order{" "}
              <span className="font-semibold">#{typedOrder.orderNumber}</span>{" "}
              is confirmed! {typedOrder.deliveryMethod === "pickup" ? "Ready for pickup" : "We'll deliver to your address"}.
              <br />
              <span className="font-medium">Total to pay on {typedOrder.deliveryMethod === "pickup" ? "pickup" : "delivery"}: {formattedTotal}</span>
            </>
          ) : (
            <>
              Your order{" "}
              <span className="font-semibold">#{typedOrder.orderNumber}</span>{" "}
              has been placed.
            </>
          )}
        </p>
        {typedOrder.customer?.email && (
          <p className="text-sm text-gray-500 mt-2">
            A confirmation has been sent to {typedOrder.customer.email}.
          </p>
        )}

        <div className="mt-6 flex flex-col  gap-3 justify-center">
          <Button
            onClick={() => router.push(`/your-orders/order-details?orderId=${orderId}`)}
            className="px-6 py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625] w-full"
          >
            Track your order
          </Button>
          <Button
            onClick={() => router.push("/marketplace")}
            variant="outline"
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 w-full"
          >
            Continue shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
