"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Loader2, 
  RotateCcw, 
  DollarSign, 
  MoreHorizontal,
  AlertTriangle 
} from "lucide-react";

type OrderCancelActionsProps = {
  orderId: string;
  orderNumber: string;
  previousStatus?: string | null;
  total: number;
  onOrderUpdated?: () => void;
  disabled?: boolean;
};

type RefundType = "full" | "partial";

export function OrderCancelActions({
  orderId,
  orderNumber,
  previousStatus,
  total,
  onOrderUpdated,
  disabled = false,
}: OrderCancelActionsProps) {
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundType, setRefundType] = useState<RefundType>("full");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [reactivateNotes, setReactivateNotes] = useState("");

  const trpc = useTRPC();

  const reactivateOrderMutation = useMutation(
    trpc.adminOrders.reactivateOrder.mutationOptions({
      onSuccess: () => {
        toast.success("Order reactivated successfully");
        onOrderUpdated?.();
        setShowReactivateDialog(false);
        setReactivateNotes("");
      },
      onError: (error) => {
        toast.error(`Failed to reactivate order: ${error.message}`);
      },
    })
  );

  const initiateRefundMutation = useMutation(
    trpc.adminOrders.initiateRefund.mutationOptions({
      onSuccess: () => {
        toast.success("Refund initiated successfully");
        onOrderUpdated?.();
        setShowRefundDialog(false);
        resetRefundForm();
      },
      onError: (error) => {
        toast.error(`Failed to initiate refund: ${error.message}`);
      },
    })
  );

  const resetRefundForm = () => {
    setRefundType("full");
    setRefundAmount("");
    setRefundReason("");
    setRefundNotes("");
  };

  const handleReactivateOrder = () => {
    if (!reactivateNotes.trim()) {
      toast.error("Please provide notes for reactivation");
      return;
    }

    reactivateOrderMutation.mutate({
      orderId,
      notes: reactivateNotes.trim(),
    });
  };

  const handleInitiateRefund = () => {
    if (!refundReason.trim()) {
      toast.error("Please provide a refund reason");
      return;
    }

    if (refundType === "partial") {
      const amount = parseFloat(refundAmount);
      if (isNaN(amount) || amount <= 0 || amount > total) {
        toast.error("Please enter a valid partial refund amount");
        return;
      }
    }

    initiateRefundMutation.mutate({
      orderId,
      refundType,
      amount: refundType === "partial" ? parseFloat(refundAmount) : undefined,
      reason: refundReason.trim(),
      notes: refundNotes.trim() || null,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      currencyDisplay: "code",
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace("UGX", "UGX");
  };

  const canReactivate = previousStatus && previousStatus !== "cancelled";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            disabled={disabled}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canReactivate && (
            <DropdownMenuItem
              onClick={() => setShowReactivateDialog(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reactivate Order
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setShowRefundDialog(true)}
            className="text-green-600 hover:text-green-700"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Initiate Refund
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reactivate Order Dialog */}
      <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Order #{orderNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the order to its previous status: "{previousStatus}". 
              The customer will be notified of the reactivation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="reactivate-notes">Reactivation Notes *</Label>
            <Textarea
              id="reactivate-notes"
              placeholder="Explain why this order is being reactivated..."
              value={reactivateNotes}
              onChange={(e) => setReactivateNotes(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reactivateOrderMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivateOrder}
              disabled={reactivateOrderMutation.isPending || !reactivateNotes.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {reactivateOrderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reactivating...
                </>
              ) : (
                "Reactivate Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Initiate Refund for Order #{orderNumber}
            </DialogTitle>
            <DialogDescription>
              Process a refund for this cancelled order. Ensure you have the proper authorization before proceeding.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Refund Type */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Refund Type
              </Label>
              <RadioGroup value={refundType} onValueChange={(value) => setRefundType(value as RefundType)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full">Full Refund ({formatCurrency(total)})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="partial" id="partial" />
                  <Label htmlFor="partial">Partial Refund</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Partial Refund Amount */}
            {refundType === "partial" && (
              <div>
                <Label htmlFor="refund-amount">Refund Amount *</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  max={total}
                  min={0}
                  step="0.01"
                  className="mt-2"
                />
                <div className="text-sm text-gray-500 mt-1">
                  Maximum refund amount: {formatCurrency(total)}
                </div>
              </div>
            )}

            {/* Refund Reason */}
            <div>
              <Label htmlFor="refund-reason">Refund Reason *</Label>
              <Input
                id="refund-reason"
                placeholder="e.g., Order cancelled by customer, Items unavailable, etc."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <Label htmlFor="refund-notes">Additional Notes</Label>
              <Textarea
                id="refund-notes"
                placeholder="Any additional details about the refund..."
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            {/* Warning */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="text-sm text-gray-700">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                <strong>Important:</strong> This will initiate the refund process. 
                Make sure to process the actual refund through your payment processor.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRefundDialog(false)}
              disabled={initiateRefundMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleInitiateRefund}
              disabled={
                initiateRefundMutation.isPending || 
                !refundReason.trim() ||
                (refundType === "partial" && (!refundAmount || parseFloat(refundAmount) <= 0))
              }
              className="bg-[#C5F82A] text-black hover:bg-[#B4E729]"
            >
              {initiateRefundMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Initiate Refund"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}