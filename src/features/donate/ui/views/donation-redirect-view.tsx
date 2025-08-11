"use client";

import { Loader2, Heart } from "lucide-react";

interface DonationRedirectViewProps {
  donationId: string;
}

export default function DonationRedirectView({
  donationId,
}: DonationRedirectViewProps) {
  // Payment processing is now handled by DonationStateManager
  // This component only shows the loading state

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-4">
            <Heart className="h-12 w-12 text-green-600 fill-current" />
          </div>
        </div>

        <div className="space-y-4">
          <Loader2 className="animate-spin rounded-full h-8 w-8 text-[#C5F82A] mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900">
            Redirecting to Payment Gateway
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Thank you for your generosity! We're preparing your secure payment
            session. You'll be redirected to complete your donation shortly.
          </p>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-xs">
            <strong>Please do not close this window.</strong> You will be
            automatically redirected to the payment gateway to complete your
            donation.
          </p>
        </div>
      </div>
    </div>
  );
}