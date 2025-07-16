"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Shield } from "lucide-react";
import { trpc } from "@/trpc/client";

interface CustomPaymentFormProps {
  amount: number;
  currency?: string;
  description: string;
  orderId: string;
  billingInfo: {
    email_address: string;
    phone_number: string;
    country_code: string;
    first_name: string;
    last_name: string;
    line_1: string;
  };
}

export function CustomPaymentForm({
  amount,
  currency = "UGX",
  description,
  orderId,
  billingInfo,
}: CustomPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const registerIpn = trpc.payments.registerIpn.useMutation();
  const submitOrder = trpc.payments.submitOrder.useMutation();

  const initializePayment = async () => {
    setIsLoading(true);

    try {
      // Register IPN
      const ipnResult = await registerIpn.mutateAsync({
        url: "https://0c2c03484da5.ngrok-free.app/api/webhooks/pesapal",
        ipn_notification_type: "POST",
      });

      // Submit order
      const orderResult = await submitOrder.mutateAsync({
        id: orderId,
        currency,
        amount,
        description,
        callback_url:
          "https://0c2c03484da5.ngrok-free.app/api/payment/callback",
        notification_id: ipnResult.ipn_id,
        billing_address: billingInfo,
      });

      if (orderResult.redirect_url) {
        setPaymentUrl(orderResult.redirect_url);
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (paymentUrl) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Secure Payment
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete your payment of {currency} {amount.toLocaleString()}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <iframe
              src={paymentUrl}
              className="w-full h-[600px] border-0 rounded-b-lg"
              title="Payment Form"
              sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation"
            />
            <div className="absolute top-4 right-4 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
              🔒 SSL Secured
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Amount:</span>
            <span className="font-medium">
              {currency} {amount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Description:</span>
            <span className="font-medium text-sm">{description}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Order ID:</span>
            <span className="font-medium text-sm">{orderId}</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-lg">
              {currency} {amount.toLocaleString()}
            </span>
          </div>
        </div>

        <Button
          onClick={initializePayment}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initializing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Proceed to Payment
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Secured by PesaPal</span>
        </div>
      </CardContent>
    </Card>
  );
}
