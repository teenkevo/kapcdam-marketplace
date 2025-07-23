"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function DonationFailedPage() {
  const searchParams = useSearchParams();
  const donationRef = searchParams.get("ref");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900">Payment Failed</h1>
            <p className="text-gray-600">
              We couldn't process your donation at this time. This might be due
              to insufficient funds, an expired card, or a temporary issue with
              the payment processor.
            </p>
          </div>

          {donationRef && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Reference number:</p>
              <p className="font-mono font-semibold text-gray-900">
                {donationRef}
              </p>
            </div>
          )}

          <div className="space-y-3 pt-4">
            <Link href="/donate" className="block">
              <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Return to Homepage
              </Button>
            </Link>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-800">
              <strong>Need help?</strong> If you continue to experience issues,
              please contact us at donations@kapcdam.org or try using a
              different payment method.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
