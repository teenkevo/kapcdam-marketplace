"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

interface PaymentRedirectViewProps {
  orderId: string;
}

export default function PaymentRedirectView({
  orderId,
}: PaymentRedirectViewProps) {
  const trpc = useTRPC();

  const processPaymentMutation = useMutation(
    trpc.orders.processOrderPayment.mutationOptions({
      onSuccess: ({ paymentUrl }) => {
        window.location.href = paymentUrl;
      },
    })
  );

  useEffect(() => {
    if (orderId) {
      processPaymentMutation.mutate({ orderId });
    }
  }, [orderId, processPaymentMutation]);

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
