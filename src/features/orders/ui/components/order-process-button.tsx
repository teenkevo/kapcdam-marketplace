"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";

type OrderProcessButtonProps = {
  orderId: string;
  orderNumber: string;
  onOrderUpdated?: () => void;
  disabled?: boolean;
};

export function OrderProcessButton({
  orderId,
  orderNumber,
  onOrderUpdated,
  disabled = false,
}: OrderProcessButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const trpc = useTRPC();

  const processOrderMutation = useMutation(
    trpc.adminOrders.updateOrderStatusAdmin.mutationOptions({
      onSuccess: () => {
        toast.success("Order moved to processing");
        onOrderUpdated?.();
        setShowConfirmDialog(false);
      },
      onError: (error) => {
        toast.error(`Failed to process order: ${error.message}`);
      },
    })
  );

  const handleProcessOrder = () => {
    processOrderMutation.mutate({
      orderId,
      status: "processing",
    });
  };

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className="bg-[#C5F82A] text-black hover:bg-[#B4E729] font-semibold"
        onClick={() => setShowConfirmDialog(true)}
        disabled={disabled || processOrderMutation.isPending}
      >
        {processOrderMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          "Process Order"
        )}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Order #{orderNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the order to "Processing" status, indicating that you have begun fulfilling the order. 
              The customer will be notified of this status change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processOrderMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcessOrder}
              disabled={processOrderMutation.isPending}
              className="bg-[#C5F82A] text-black hover:bg-[#B4E729]"
            >
              {processOrderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Yes, Process Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}