"use client";

import { useCallback, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TriangleAlert, Clock, Heart, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Props {
  donationId: string;
  mode?: "pending" | "failed";
}

export default function DonationPendingOrFailedView({ donationId, mode }: Props) {
  const trpc = useTRPC();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: donation, isLoading } = useQuery(
    trpc.donations.getDonationStatus.queryOptions({ donationId })
  );

  const processDonationPaymentMutation = useMutation(
    trpc.donations.processDonationPayment.mutationOptions({
      onSuccess: ({ paymentUrl }) => {
        setIsProcessing(true);
        window.location.href = paymentUrl;
      },
      onError: (error) => {
        toast.error(`Payment processing failed: ${error.message}`);
        setIsProcessing(false);
      },
    })
  );

  const handleRetryPayment = useCallback(() => {
    processDonationPaymentMutation.mutate({ donationId });
  }, [donationId, processDonationPaymentMutation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5F82A] mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading Donation...</h3>
          <p className="text-gray-600">
            Please wait while we fetch your donation details
          </p>
        </div>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <TriangleAlert className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Donation not found</h1>
          <p className="text-gray-600 mb-6">
            The donation you're looking for doesn't exist or there was an error loading it.
          </p>
          <Link href="/donate">
            <Button className="px-6 py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625]">
              Make a New Donation
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(donation.amount);

  const isPending = donation.paymentStatus === "pending";
  const isFailed = donation.paymentStatus === "failed";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {(processDonationPaymentMutation.isPending || isProcessing) && (
          <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-md z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md mx-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5F82A] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Processing payment...
              </h3>
              <p className="text-gray-600 mb-1">
                We're preparing your payment session. You'll be redirected
                to the payment gateway shortly.
              </p>
              <p className="text-sm text-gray-500">
                Please do not close this window.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="flex justify-center items-center mb-6">
            {isFailed ? (
              <div className="rounded-full bg-red-100 p-4">
                <TriangleAlert className="w-12 h-12 text-red-600" />
              </div>
            ) : (
              <div className="rounded-full bg-orange-100 p-4">
                <Clock className="w-12 h-12 text-orange-600" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold mb-3">
            {isFailed
              ? "Payment Failed"
              : isPending
                ? "Complete Your Donation"
                : "Donation Pending"}
          </h1>

          <p className="text-gray-700 mb-2">
            Donation ID: <span className="font-semibold">{donationId}</span>
          </p>
          <p className="text-lg font-semibold text-gray-900 mb-4">{formattedAmount}</p>

          {isFailed && (
            <p className="text-gray-600 mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
              We couldn't process your donation. This might be due to insufficient funds, 
              an expired card, or a temporary issue with the payment processor.
            </p>
          )}

          {isPending && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-blue-800 mb-2">
                <Heart className="h-5 w-5 fill-current" />
                <span className="font-medium">Your generosity matters!</span>
              </div>
              <p className="text-blue-800 text-sm">
                Click "Continue Donation" below to complete your contribution and make a difference.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {(isFailed || isPending) && (
              <Button
                onClick={handleRetryPayment}
                disabled={
                  processDonationPaymentMutation.isPending || isProcessing
                }
                className="w-full px-6 py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {processDonationPaymentMutation.isPending
                  ? "Processing..."
                  : isFailed
                    ? "Retry Payment"
                    : "Continue Donation"}
              </Button>
            )}

            <div className="flex space-x-3">
              <Link href="/donate" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                >
                  Make New Donation
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                >
                  Return Home
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            Need help? Contact us at{" "}
            <a 
              href="mailto:donations@kapcdam.org" 
              className="text-blue-600 hover:underline"
            >
              donations@kapcdam.org
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}