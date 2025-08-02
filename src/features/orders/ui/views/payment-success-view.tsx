"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Timer, Package } from "lucide-react";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderRef = searchParams.get("ref");
  const [countdown, setCountdown] = useState(12);

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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-gray-100 p-4">
              <CheckCircle className="h-12 w-12 text-gray-800" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Payment Successful!
            </h1>
            <p className="text-gray-600">
              Your payment has been processed and your order is confirmed.
            </p>
          </div>

          {/* Order Reference */}
          {orderRef && (
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Order Reference</p>
              <p className="font-mono text-lg font-semibold text-gray-800">
                {orderRef}
              </p>
            </div>
          )}

          {/* What's Next */}
          <div className="text-left space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-gray-600" />
              <h2 className="font-semibold text-gray-900">What happens next?</h2>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• You'll receive an order confirmation email shortly</li>
              <li>• Your payment receipt will be sent within minutes</li>
              <li>• We'll prepare your order for delivery/pickup</li>
              <li>• You'll be notified when your order is ready</li>
            </ul>
          </div>

          {/* Countdown and Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
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
          </div>

          {/* Support */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Questions about your order? Contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessView() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}