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

type OrderDeliveredButtonProps = {
  orderId: string;
  orderNumber: string;
  deliveryMethod: "pickup" | "local_delivery";
  onOrderUpdated?: () => void;
  disabled?: boolean;
};

export function OrderDeliveredButton({
  orderId,
  orderNumber,
  deliveryMethod,
  onOrderUpdated,
  disabled = false,
}: OrderDeliveredButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const trpc = useTRPC();

  const markDeliveredMutation = useMutation(
    trpc.adminOrders.updateOrderStatusAdmin.mutationOptions({
      onSuccess: () => {
        toast.success(
          deliveryMethod === "pickup" 
            ? "Order marked as picked up" 
            : "Order marked as delivered"
        );
        onOrderUpdated?.();
        setShowConfirmDialog(false);
      },
      onError: (error) => {
        toast.error(`Failed to mark order as delivered: ${error.message}`);
      },
    })
  );

  const handleMarkDelivered = () => {
    markDeliveredMutation.mutate({
      orderId,
      status: "DELIVERED",
    });
  };

  const actionText = deliveryMethod === "pickup" ? "Picked Up" : "Delivered";
  const buttonText = deliveryMethod === "pickup" ? "Mark Picked Up" : "Mark Delivered";

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className="bg-[#C5F82A] text-black hover:bg-[#B4E729] font-semibold"
        onClick={() => setShowConfirmDialog(true)}
        disabled={disabled || markDeliveredMutation.isPending}
      >
        {markDeliveredMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Updating...
          </>
        ) : (
          buttonText
        )}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark Order #{orderNumber} as {actionText}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the order as "Delivered" and complete the order fulfillment process. 
              {deliveryMethod === "pickup" 
                ? " Confirm that the customer has successfully picked up their order."
                : " Confirm that the order has been delivered to the customer."
              }
              {" "}This action will trigger a completion notification to the customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markDeliveredMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkDelivered}
              disabled={markDeliveredMutation.isPending}
              className="bg-[#C5F82A] text-black hover:bg-[#B4E729]"
            >
              {markDeliveredMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                `Yes, Mark as ${actionText}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}