"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, Clock, MapPin } from "lucide-react";

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
      <div className="max-w-4xl mx-auto py-10 md:py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5F82A] mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Loading Order...</h3>
          <p className="text-gray-600">Please wait while we fetch your order details</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto py-10 md:py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
        <p className="text-lg text-muted-foreground mb-8">
          The order you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button
          onClick={() => router.push('/marketplace')}
          className="px-8 py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625]"
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  const isPaid = (order as any)?.paymentStatus === "paid";
  const isCOD = (order as any)?.paymentMethod === "cod";

  return (
    <div className="max-w-4xl mx-auto py-10 md:py-20">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4 text-green-700">
          {isPaid ? "Payment Successful!" : isCOD ? "Order Confirmed!" : "Order Created!"}
        </h1>
        <p className="text-lg text-muted-foreground">
          Order #{(order as any).orderNumber}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {isPaid && "Your payment has been processed successfully."}
          {isCOD && "Your order has been confirmed. You'll pay when your order arrives."}
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-white border border-dashed rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Order Details</h2>

        {/* Order Items */}
        <div className="space-y-3 mb-6">
          {(order as any).orderItems?.map((item: any) => (
            <div
              key={item._id}
              className="flex justify-between items-center py-3 border-b last:border-b-0"
            >
              <div className="flex-1">
                <p className="font-medium">
                  {item.name}
                </p>
                {item.variantSku && (
                  <p className="text-sm text-muted-foreground">
                    SKU: {item.variantSku}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Quantity: {item.quantity} × UGX {item.unitPrice.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  UGX {item.lineTotal.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>UGX {(order as any).subtotal.toLocaleString()}</span>
          </div>
          {(order as any).shippingCost > 0 && (
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>UGX {(order as any).shippingCost.toLocaleString()}</span>
            </div>
          )}
          {(order as any).orderLevelDiscount && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({(order as any).orderLevelDiscount.couponApplied}):</span>
              <span>-UGX {(order as any).orderLevelDiscount.discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>UGX {(order as any).total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">What's Next?</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">Order Processing</p>
              <p className="text-sm text-muted-foreground">
                {isPaid 
                  ? "Your order is being prepared for shipment."
                  : isCOD 
                    ? "Your order is confirmed and will be prepared for delivery."
                    : "Waiting for payment confirmation to begin processing."
                }
              </p>
            </div>
          </div>

          {(order as any).deliveryMethod === "local_delivery" ? (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Delivery</p>
                <p className="text-sm text-muted-foreground">
                  {isCOD 
                    ? "Your order will be delivered to your address. Payment is due upon delivery."
                    : "Your order will be delivered to your address."
                  }
                </p>
                {(order as any).estimatedDelivery && (
                  <p className="text-sm text-muted-foreground">
                    Estimated delivery: {new Date((order as any).estimatedDelivery).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium">Pickup</p>
                <p className="text-sm text-muted-foreground">
                  Your order will be ready for pickup at our offices. We'll notify you when it's ready.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={() => router.push('/marketplace')}
          className="px-8 py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625]"
        >
          Continue Shopping
        </Button>
        
        <Button
          onClick={() => router.push('/orders')}
          variant="outline"
          className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
        >
          View All Orders
        </Button>
      </div>
    </div>
  );
}