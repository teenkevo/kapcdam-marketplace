"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface BankDonationRecordDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  donation: {
    donationId: string;
    amount?: number;
  };
}

export function BankDonationRecordDialog({
  open,
  setOpen,
  donation,
}: BankDonationRecordDialogProps) {
  const [showTick, setShowTick] = useState(false);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // Reset animation state
      setShowTick(false);
      // Trigger animation after a short delay
      const timer = setTimeout(() => {
        setShowTick(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied((prev) => ({ ...prev, [key]: true }));
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
      duration: 2000,
    });
    setTimeout(() => {
      setCopied((prev) => ({ ...prev, [key]: false }));
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 relative">
            {/* Animated background circle */}
            <div
              className={`w-16 h-16 bg-green-100 rounded-full flex items-center justify-center transition-all duration-500 ${
                showTick ? "scale-100 opacity-100" : "scale-50 opacity-0"
              }`}
            >
              {/* Animated checkmark */}
              <div
                className={`w-10 h-10 bg-green-500 rounded-full flex items-center justify-center transition-all duration-700 delay-200 ${
                  showTick ? "scale-100 opacity-100" : "scale-0 opacity-0"
                }`}
              >
                <Check
                  className={`w-6 h-6 text-white transition-all duration-500 delay-400 ${
                    showTick ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                />
              </div>
            </div>
          </div>

          <DialogTitle className="text-xl font-semibold text-gray-900">
            Thank You for Your Donation!
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Your donation has been recorded. Please complete the payment using
            the bank transfer details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reference Number */}
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-700 mb-2">
              Your reference number is:
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono font-bold text-green-700 text-lg">
                {donation.donationId}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    donation.donationId,
                    "Reference number",
                    "ref"
                  )
                }
                className="h-8 w-8 p-0 hover:bg-green-100"
              >
                {copied["ref"] ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Please use this reference when making your bank transfer.
            </p>
          </div>

          {/* Bank Transfer Details */}
          {/* Amount */}

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-xs text-gray-900 font-medium mb-2">
              Bank Transfer Details
            </h4>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Bank Name:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Stanbic Bank Uganda</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        "Stanbic Bank Uganda",
                        "Bank name",
                        "bank"
                      )
                    }
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200"
                  >
                    {copied["bank"] ? (
                      <Check className="h-2.5 w-2.5 text-green-600" />
                    ) : (
                      <Copy className="h-2.5 w-2.5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Account Name:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">KAPCDAM Uganda</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard("KAPCDAM Uganda", "Account name", "acc")
                    }
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200"
                  >
                    {copied["acc"] ? (
                      <Check className="h-2.5 w-2.5 text-green-600" />
                    ) : (
                      <Copy className="h-2.5 w-2.5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium font-mono">1234567890</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard("1234567890", "Account number", "num")
                    }
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200"
                  >
                    {copied["num"] ? (
                      <Check className="h-2.5 w-2.5 text-green-600" />
                    ) : (
                      <Copy className="h-2.5 w-2.5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-gray-300 pt-1.5 mt-2 text-xs">
                <span className="text-gray-600">Payment Reference:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-mono">
                    {donation.donationId}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        donation.donationId,
                        "Payment reference",
                        "payref"
                      )
                    }
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200"
                  >
                    {copied["payref"] ? (
                      <Check className="h-2.5 w-2.5 text-green-600" />
                    ) : (
                      <Copy className="h-2.5 w-2.5" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Amount:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">USD {donation.amount}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `USD ${donation.amount}`,
                        "Amount",
                        "amount"
                      )
                    }
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200"
                  >
                    {copied["amount"] ? (
                      <Check className="h-2.5 w-2.5 text-green-600" />
                    ) : (
                      <Copy className="h-2.5 w-2.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => setOpen(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
