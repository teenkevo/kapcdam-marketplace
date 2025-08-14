"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, AlertTriangle } from "lucide-react";

type CancelReason = "customer_request" | "payment_failed" | "items_unavailable" | "fraud_suspected" | "other";

const cancelReasonOptions: { value: CancelReason; label: string; description: string }[] = [
  { 
    value: "customer_request", 
    label: "Customer Request", 
    description: "Customer requested to cancel the order"
  },
  { 
    value: "payment_failed", 
    label: "Payment Failed", 
    description: "Payment could not be processed"
  },
  { 
    value: "items_unavailable", 
    label: "Items Not Available", 
    description: "One or more items are out of stock"
  },
  { 
    value: "fraud_suspected", 
    label: "Fraud Suspected", 
    description: "Suspicious order activity detected"
  },
  { 
    value: "other", 
    label: "Other", 
    description: "Other reason (please specify in notes)"
  },
];

type OrderCancelDialogProps = {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCancelled?: () => void;
};

export function OrderCancelDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
  onOrderCancelled
}: OrderCancelDialogProps) {
  const trpc = useTRPC();
  const [reason, setReason] = useState<CancelReason>("other");
  const [notes, setNotes] = useState("");

  const cancelOrderMutation = useMutation(
    trpc.adminOrders.cancelOrderWithNotes.mutationOptions({
      onSuccess: () => {
        toast.success("Order cancelled successfully");
        onOrderCancelled?.();
        onOpenChange(false);
        // Reset form
        setReason("other");
        setNotes("");
      },
      onError: (error) => {
        toast.error(`Failed to cancel order: ${error.message}`);
      },
    })
  );

  const handleCancel = () => {
    if (!notes.trim()) {
      toast.error("Please provide cancellation notes");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel order ${orderNumber}? This action cannot be undone.`
    );

    if (confirmed) {
      cancelOrderMutation.mutate({
        orderId,
        reason,
        notes: notes.trim(),
      });
    }
  };

  const handleClose = () => {
    if (!cancelOrderMutation.isPending) {
      onOpenChange(false);
      // Reset form when closing
      setReason("other");
      setNotes("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Cancel Order #{orderNumber}
          </DialogTitle>
          <DialogDescription>
            Please select a reason and provide detailed notes for cancelling this order. 
            This action will permanently cancel the order and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cancellation Reason */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Cancellation Reason
            </Label>
            <RadioGroup value={reason} onValueChange={(value) => setReason(value as CancelReason)}>
              <div className="space-y-3">
                {cancelReasonOptions.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem 
                      value={option.value} 
                      id={option.value} 
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={option.value} 
                        className="font-medium cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      <div className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-base font-semibold mb-2 block">
              Cancellation Notes *
            </Label>
            <Textarea
              id="notes"
              placeholder="Please provide detailed notes about the cancellation reason, any customer communication, refund details, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={cancelOrderMutation.isPending}
            />
            <div className="text-sm text-gray-500 mt-1">
              These notes will be saved with the order for future reference.
            </div>
          </div>

          {/* Impact Warning */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong> Cancelling this order will:
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Restore any reserved inventory</li>
                <li>Process any necessary refunds (if payment was made)</li>
                <li>Send a cancellation notification to the customer</li>
                <li>Update order status to "Cancelled"</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={cancelOrderMutation.isPending}
          >
            Keep Order
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleCancel}
            disabled={cancelOrderMutation.isPending || !notes.trim()}
          >
            {cancelOrderMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Cancel Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}