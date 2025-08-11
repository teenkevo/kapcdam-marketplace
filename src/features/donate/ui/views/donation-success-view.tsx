"use client";

import { useEffect } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Heart, Download, Share2 } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

interface Props {
  donationId: string;
}

export default function DonationSuccessView({ donationId }: Props) {
  const trpc = useTRPC();

  const { data: donation, isLoading } = useQuery(
    trpc.donations.getDonationStatus.queryOptions({ donationId })
  );

  useEffect(() => {
    // Trigger confetti animation on success
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#C5F82A", "#22C55E", "#10B981", "#FFD700"],
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading...</h3>
          <p className="text-gray-600">Confirming your donation details...</p>
        </div>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Donation not found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find the details for this donation.
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

  const isRecurring = donation.type === "monthly";

  const handleShareDonation = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "I just donated to KAPCDAM!",
          text: `I made a ${formattedAmount} donation to support children with disabilities. Join me in making a difference!`,
          url: window.location.origin + "/donate",
        });
      } catch (error) {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(
          `I just donated ${formattedAmount} to KAPCDAM! Join me: ${window.location.origin}/donate`
        );
      }
    } else {
      // Copy to clipboard fallback
      navigator.clipboard.writeText(
        `I just donated ${formattedAmount} to KAPCDAM! Join me: ${window.location.origin}/donate`
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl p-8 text-center">
        {/* Success Icon with Animation */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-4 animate-pulse">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Thank You for Your {isRecurring ? "Monthly" : ""} Donation! 🎉
          </h1>
          <p className="text-lg text-gray-700">
            Your generous <strong>{formattedAmount}</strong> donation will make
            a real difference in the lives of children with disabilities.
          </p>
        </div>

        {/* Donation Details Card */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Donation ID</p>
              <p className="font-mono font-semibold text-gray-900">
                {donationId}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Amount</p>
              <p className="font-semibold text-gray-900">{formattedAmount}</p>
            </div>
            <div>
              <p className="text-gray-600">Type</p>
              <p className="font-semibold text-gray-900">
                {isRecurring ? "Monthly Recurring" : "One-time"}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <p className="font-semibold text-green-600">✓ Completed</p>
            </div>
          </div>
        </div>

        {/* Impact Message */}
        <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center space-x-2 text-green-700 mb-3">
            <Heart className="h-6 w-6 fill-current" />
            <span className="font-semibold text-lg">Your Impact</span>
            <Heart className="h-6 w-6 fill-current" />
          </div>
          <p className="text-green-800 text-sm leading-relaxed">
            {isRecurring
              ? `Your monthly ${formattedAmount} donation will provide ongoing support and resources to help children with disabilities thrive throughout the year.`
              : `Your ${formattedAmount} donation will help provide therapy, education resources, and support services to children with disabilities in our community.`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Link href="/donate" className="block">
              <Button className="w-full py-3 bg-[#C5F82A] text-black font-semibold rounded-lg hover:bg-[#B8E625]">
                Donate Again
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button
                variant="outline"
                className="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
              >
                Return Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Message */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 leading-relaxed">
            A receipt has been sent to your email address.
            {isRecurring &&
              " You can manage your monthly donations by contacting us at donations@kapcdam.org."}{" "}
            Thank you for supporting KAPCDAM's mission! 💚
          </p>
        </div>
      </div>
    </div>
  );
}
