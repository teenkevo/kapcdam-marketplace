"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";

type CustomerCancelReason = "changed_mind" | "found_better_price" | "no_longer_needed" | "ordered_by_mistake" | "delivery_too_long" | "other";

const customerCancelReasonOptions: { value: CustomerCancelReason; label: string; description: string }[] = [
  { 
    value: "changed_mind", 
    label: "Changed my mind", 
    description: "I no longer want this order"
  },
  { 
    value: "found_better_price", 
    label: "Found a better price", 
    description: "I found the same items at a lower price elsewhere"
  },
  { 
    value: "no_longer_needed", 
    label: "No longer needed", 
    description: "I don't need these items anymore"
  },
  { 
    value: "ordered_by_mistake", 
    label: "Ordered by mistake", 
    description: "I accidentally placed this order"
  },
  { 
    value: "delivery_too_long", 
    label: "Delivery taking too long", 
    description: "The delivery time is longer than expected"
  },
  { 
    value: "other", 
    label: "Other reason", 
    description: "Please specify in the notes below"
  },
];

type CustomerOrderCancelDialogProps = {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCancelled?: () => void;
};

export function CustomerOrderCancelDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
  onOrderCancelled
}: CustomerOrderCancelDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState<CustomerCancelReason>("other");
  const [notes, setNotes] = useState("");

  const cancelOrderMutation = useMutation(
    trpc.orders.cancelConfirmedOrder.mutationOptions({
      onSuccess: () => {
        toast.success("Order cancelled successfully");
        onOrderCancelled?.();
        onOpenChange(false);
        // Invalidate order queries to update the UI
        queryClient.invalidateQueries(
          trpc.orders.getUserOrders.queryOptions({ limit: 20, offset: 0 })
        );
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
    // For "other" reason, require notes
    if (reason === "other" && !notes.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

      cancelOrderMutation.mutate({
        orderId,
        reason,
        notes: notes.trim() || null,
      });
    
  };

  const handleClose = () => {
    if (!cancelOrderMutation.isPending) {
      onOpenChange(false);
      // Reset form when closing
      setReason("other");
      setNotes("");
    }
  };

  const selectedReasonOption = customerCancelReasonOptions.find(option => option.value === reason);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Cancel Order #{orderNumber}
          </DialogTitle>
          <DialogDescription>
            Please let us know why you're cancelling this order. This helps us improve our service.
            Your order will be cancelled and any payment will be refunded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cancellation Reason */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Reason for cancellation
            </Label>
            <Select value={reason} onValueChange={(value) => setReason(value as CustomerCancelReason)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {customerCancelReasonOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      {/* <span className="text-sm text-gray-500">{option.description}</span> */}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes - Required for "other" reason */}
          <div>
            <Label htmlFor="notes" className="text-base font-semibold mb-2 block">
              Additional details {reason === "other" && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                reason === "other" 
                  ? "Please explain why you're cancelling this order..."
                  : "Any additional details about your cancellation (optional)"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={cancelOrderMutation.isPending}
            />
            {reason === "other" && (
              <div className="text-sm text-gray-500 mt-1">
                Please provide a reason for cancellation
              </div>
            )}
          </div>

          {/* Impact Information */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="text-sm text-gray-800">
              <strong>What happens next:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Your order will be cancelled immediately</li>
                <li>Any reserved items will be made available to other customers</li>
                <li>If you've already paid, you'll receive a full refund within 3-5 business days</li>
                <li>You'll receive a confirmation email shortly</li>
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
            disabled={
              cancelOrderMutation.isPending || 
              (reason === "other" && !notes.trim())
            }
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