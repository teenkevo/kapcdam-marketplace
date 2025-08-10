"use client";

import { Loader2 } from "lucide-react";

interface PaymentRedirectViewProps {
  orderId: string;
}

export default function PaymentRedirectView({
  orderId,
}: PaymentRedirectViewProps) {
  // Payment processing is now handled by CheckoutStateManager
  // This component only shows the loading state

  return (
    <div className="max-w-7xl flex-1 mx-auto py-10 md:py-20 relative flex justify-center items-center">
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-12 w-12 text-[#C5F82A] mx-auto mb-4" />
          <h3 className="text-base font-medium mb-2">Redirecting to pesapal</h3>
          <p className="text-gray-600 text-sm">
            Make secure payment to complete your order
          </p>
        </div>
      </div>
    </div>
  );
}
