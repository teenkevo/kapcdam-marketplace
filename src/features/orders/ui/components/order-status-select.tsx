"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ORDER_STATUSES } from "../../schema";

type OrderStatus = typeof ORDER_STATUSES[number];

const statusOptions: { value: OrderStatus; label: string; disabled?: boolean }[] = [
  { value: "PENDING_PAYMENT", label: "Pending Payment" },
  { value: "PROCESSING", label: "Processing" },
  { value: "READY_FOR_DELIVERY", label: "Ready for Delivery" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED_BY_USER", label: "Cancelled", disabled: true }, // Use cancel dialog instead
  { value: "CANCELLED_BY_ADMIN", label: "Cancelled", disabled: true }, // Use cancel dialog instead
];

type OrderStatusSelectProps = {
  currentStatus: string;
  orderId: string;
  onStatusChanged?: () => void;
  disabled?: boolean;
};

export function OrderStatusSelect({ 
  currentStatus, 
  orderId, 
  onStatusChanged,
  disabled = false 
}: OrderStatusSelectProps) {
  const trpc = useTRPC();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatusMutation = useMutation(
    trpc.adminOrders.updateOrderStatusAdmin.mutationOptions({
      onSuccess: () => {
        toast.success("Order status updated successfully");
        onStatusChanged?.();
        setIsUpdating(false);
      },
      onError: (error) => {
        toast.error(`Failed to update order status: ${error.message}`);
        setIsUpdating(false);
      },
    })
  );

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === currentStatus || newStatus === "CANCELLED_BY_USER" || newStatus === "CANCELLED_BY_ADMIN") {
      return; // Don't update if same status or cancelled (use cancel dialog)
    }

    setIsUpdating(true);
    
    // Add confirmation for certain status changes
    const criticalStatuses: OrderStatus[] = ["DELIVERED", "OUT_FOR_DELIVERY"];
    if (criticalStatuses.includes(newStatus)) {
      const confirmed = window.confirm(
        `Are you sure you want to mark this order as "${newStatus}"? This action may affect inventory and customer notifications.`
      );
      
      if (!confirmed) {
        setIsUpdating(false);
        return;
      }
    }

    updateStatusMutation.mutate({
      orderId,
      status: newStatus,
    });
  };

  // Filter out cancelled option and any invalid statuses
  const availableOptions = statusOptions.filter(option => 
    !option.disabled && option.value !== "CANCELLED_BY_USER" && option.value !== "CANCELLED_BY_ADMIN"
  );

  // Don't allow status changes for cancelled or delivered orders
  const isDisabled = disabled || 
    currentStatus === "CANCELLED_BY_USER" || 
    currentStatus === "CANCELLED_BY_ADMIN" ||
    currentStatus === "DELIVERED" || 
    isUpdating;

  return (
    <div className="flex items-center gap-2">
      {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
      <Select 
        value={currentStatus} 
        onValueChange={handleStatusChange}
        disabled={isDisabled}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableOptions.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              disabled={option.value === currentStatus}
            >
              {option.label}
              {option.value === currentStatus && " (Current)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}