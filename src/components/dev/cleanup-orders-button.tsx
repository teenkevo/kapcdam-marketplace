"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CleanupOrdersButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCleanup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cleanup-orders", { method: "POST" });
      const data = await response.json();

      if (response.ok) {
        toast.success(`Cleanup complete! Deleted ${data.deleted.orders + data.deleted.orderItems} documents`);
      } else {
        toast.error("Cleanup failed");
      }
    } catch (error) {
      toast.error("Cleanup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-center">
      <Button
        onClick={handleCleanup}
        disabled={isLoading}
        variant="destructive"
        size="sm"
        className="bg-red-600 hover:bg-red-700"
      >
        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
        {isLoading ? "Cleaning..." : "🧹 Delete All Orders"}
      </Button>
      <p className="text-xs text-gray-500 mt-1">
        Deletes all order and orderItem documents
      </p>
    </div>
  );
}