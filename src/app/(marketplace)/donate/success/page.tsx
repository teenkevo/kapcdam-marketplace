"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Heart } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function DonationSuccessPage() {
  const searchParams = useSearchParams();
  const donationRef = searchParams.get("ref");

  useEffect(() => {
  
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FFD700", "#FFA500", "#FF6347"],
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Thank You for Your Donation!
            </h1>
            <p className="text-gray-600">
              Your generous support means the world to us. Together, we're
              making a real difference in our community.
            </p>
          </div>

          {donationRef && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Your donation reference:</p>
              <p className="font-mono font-semibold text-gray-900">
                {donationRef}
              </p>
            </div>
          )}

          <div className="flex items-center justify-center space-x-2 text-red-500">
            <Heart className="h-5 w-5 fill-current" />
            <span className="text-sm font-medium">
              You're making a difference!
            </span>
            <Heart className="h-5 w-5 fill-current" />
          </div>

          <div className="space-y-3 pt-4">
            <Link href="/" className="block">
              <Button className="w-full">Return to Homepage</Button>
            </Link>
            <Link href="/donate" className="block">
              <Button variant="outline" className="w-full">
                Make Another Donation
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 pt-4">
            You will receive a receipt via email shortly. If you have any
            questions, please contact us at donations@kapcdam.org
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
