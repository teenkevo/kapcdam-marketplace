"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Timer } from "lucide-react";

export default function DonationThankYouView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const donationRef = searchParams.get("ref");
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Track conversion (view event)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "conversion", {
        send_to: "AW-CONVERSION_ID/CONVERSION_LABEL", // Replace with your actual conversion ID
        value: 1.0,
        currency: "USD",
        transaction_id: donationRef,
      });
    }

    // Countdown timer
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
  }, [router, donationRef]);

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardContent className="p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          {/* Thank You Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Thank You for Your Donation!
            </h1>
            <p className="text-gray-600">
              Your generous contribution helps us make a positive impact in our community.
            </p>
          </div>

          {/* Donation Reference */}
          {donationRef && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Donation Reference</p>
              <p className="font-mono text-lg font-semibold text-gray-800">
                {donationRef}
              </p>
            </div>
          )}

          {/* What's Next */}
          <div className="text-left space-y-2">
            <h2 className="font-semibold text-gray-900">What happens next?</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• You'll receive a confirmation email shortly</li>
              <li>• Your donation receipt will be sent within 24 hours</li>
              <li>• We'll keep you updated on how your donation is used</li>
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
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          {/* Social Sharing */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">
              Help us spread the word about our mission
            </p>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = "I just made a donation to KAPCDAM! Join me in making a difference.";
                  const url = window.location.origin;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
                }}
              >
                Share on Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = window.location.origin;
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
                }}
              >
                Share on Facebook
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}