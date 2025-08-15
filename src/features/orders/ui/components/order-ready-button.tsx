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

type OrderReadyButtonProps = {
  orderId: string;
  orderNumber: string;
  deliveryMethod: "pickup" | "local_delivery";
  onOrderUpdated?: () => void;
  disabled?: boolean;
};

export function OrderReadyButton({
  orderId,
  orderNumber,
  deliveryMethod,
  onOrderUpdated,
  disabled = false,
}: OrderReadyButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const trpc = useTRPC();

  const markReadyMutation = useMutation(
    trpc.adminOrders.updateOrderStatusAdmin.mutationOptions({
      onSuccess: () => {
        toast.success(
          deliveryMethod === "pickup" 
            ? "Order marked ready for pickup" 
            : "Order marked ready for delivery"
        );
        onOrderUpdated?.();
        setShowConfirmDialog(false);
      },
      onError: (error) => {
        toast.error(`Failed to mark order as ready: ${error.message}`);
      },
    })
  );

  const handleMarkReady = () => {
    markReadyMutation.mutate({
      orderId,
      status: "READY_FOR_DELIVERY",
    });
  };

  const actionText = deliveryMethod === "pickup" ? "Pickup" : "Delivery";

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className="bg-[#C5F82A] text-black hover:bg-[#B4E729] font-semibold"
        onClick={() => setShowConfirmDialog(true)}
        disabled={disabled || markReadyMutation.isPending}
      >
        {markReadyMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Updating...
          </>
        ) : (
          `Mark Ready for ${actionText}`
        )}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark Order #{orderNumber} Ready for {actionText}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will update the order status to "Ready" and notify the customer that their order is 
              ready for {deliveryMethod === "pickup" ? "pickup" : "delivery"}. 
              {deliveryMethod === "pickup" 
                ? " Make sure all items are prepared and accessible for customer pickup."
                : " Ensure the order is packaged and ready for the delivery driver."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markReadyMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkReady}
              disabled={markReadyMutation.isPending}
              className="bg-[#C5F82A] text-black hover:bg-[#B4E729]"
            >
              {markReadyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                `Yes, Mark Ready for ${actionText}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}