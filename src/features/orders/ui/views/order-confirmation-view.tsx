"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Home,
  Package,
  MapPin,
  CreditCard,
  Timer,
} from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

// Extended order type that includes order items from the GROQ query
interface OrderWithItems {
  _id: string;
  orderNumber: string;
  orderDate: string;
  customer: {
    _ref: string;
    _type: "reference";
  };
  subtotal: number;
  tax: number | null;
  shippingCost: number | null;
  totalItemDiscounts: number | null;
  orderLevelDiscount?: {
    discountCode?: {
      _ref: string;
      _type: "reference";
    } | null;
    discountAmount: number;
    originalPercentage: number;
    appliedAt: string;
  } | null;
  total: number;
  currency: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "partial";
  paymentMethod: "pesapal" | "cod";
  transactionId?: string | null;
  paidAt?: string | null;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  notes?: string | null;
  isActive: boolean;
  shippingAddress: {
    _id: string;
    label: "home" | "work" | "other";
    fullName: string;
    phone: string;
    address: string;
    landmark?: string | null;
    city?: string | null;
    country: string;
    deliveryInstructions?: string | null;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  deliveryMethod: "pickup" | "local_delivery";
  estimatedDelivery?: string | null;
  deliveredAt?: string | null;
  orderItems: Array<{
    _id: string;
    type: "product" | "course";
    quantity: number;
    originalPrice: number;
    discountApplied: number;
    finalPrice: number;
    lineTotal: number;
    product?: any;
    course?: any;
    variantSnapshot?: {
      title: string;
      sku?: string;
      variantInfo?: string;
    };
    courseSnapshot?: {
      title: string;
      description?: string;
      duration?: string;
      skillLevel?: string;
    };
    fulfillmentStatus?: string;
  }>;
}

interface OrderConfirmationViewProps {
  orderId: string;
}

function OrderConfirmationContent({ orderId }: OrderConfirmationViewProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [countdown, setCountdown] = useState(15);

  const { data: order, isLoading } = useQuery(
    trpc.orders.getOrderById.queryOptions({ orderId })
  );

  // Type assertion for the order data - using any for now to fix the immediate error
  const typedOrder = order as any;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoHome = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!typedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">
              Order Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The order you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <Button
              onClick={handleGoHome}
              className="w-full bg-gray-900 hover:bg-gray-800"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatPrice = (price: number) => `${price.toLocaleString()} UGX`;
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-gray-100 p-4">
                <CheckCircle className="h-12 w-12 text-gray-800" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-600">
              Thank you for your order. We'll process it shortly.
            </p>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Order Details
              </h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number</span>
                <span className="font-mono font-medium">
                  {typedOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date</span>
                <span>{formatDate(typedOrder.orderDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="capitalize px-2 py-1 bg-gray-100 rounded text-sm">
                  {typedOrder.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="capitalize">
                  {typedOrder.paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : typedOrder.paymentMethod}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-3">
              {typedOrder.orderItems?.map((item: any) => (
                <div
                  key={item._id}
                  className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {item.type === "product"
                        ? item.variantSnapshot?.title || item.product?.title
                        : item.courseSnapshot?.title || item.course?.title}
                    </p>
                    {item.variantSnapshot?.variantInfo && (
                      <p className="text-sm text-gray-600">
                        {item.variantSnapshot.variantInfo}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(item.lineTotal)}</p>
                    {item.discountApplied > 0 && (
                      <p className="text-sm text-gray-500 line-through">
                        {formatPrice(item.originalPrice * item.quantity)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        {typedOrder.shippingAddress && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">
                  Delivery Address
                </h3>
              </div>
              <div className="text-gray-700">
                <p className="font-medium">
                  {typedOrder.shippingAddress.fullName}
                </p>
                <p>{typedOrder.shippingAddress.address}</p>
                <p>{typedOrder.shippingAddress.city}</p>
                {typedOrder.shippingAddress.phone && (
                  <p className="text-sm text-gray-600 mt-1">
                    {typedOrder.shippingAddress.phone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Total */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Order Summary</h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(typedOrder.subtotal)}</span>
              </div>
              {typedOrder.totalItemDiscounts > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Item Discounts</span>
                  <span>-{formatPrice(typedOrder.totalItemDiscounts)}</span>
                </div>
              )}
              {typedOrder.orderLevelDiscount?.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>
                    -{formatPrice(typedOrder.orderLevelDiscount.discountAmount)}
                  </span>
                </div>
              )}
              {typedOrder.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{formatPrice(typedOrder.shippingCost)}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(typedOrder.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              What happens next?
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• You'll receive an order confirmation email shortly</li>
              <li>
                • We'll prepare your order for{" "}
                {typedOrder.deliveryMethod === "pickup" ? "pickup" : "delivery"}
              </li>
              <li>• You'll be notified when your order is ready</li>
              {typedOrder.paymentMethod === "cod" && (
                <li>• Payment will be collected upon delivery</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
              <Timer className="h-4 w-4" />
              <span>Redirecting to home in {countdown} seconds</span>
            </div>
            <Button
              onClick={handleGoHome}
              className="w-full bg-gray-900 hover:bg-gray-800"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OrderConfirmationView({
  orderId,
}: OrderConfirmationViewProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <OrderConfirmationContent orderId={orderId} />
    </Suspense>
  );
}
