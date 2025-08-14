"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, MapPin, CreditCard, Package, CheckCircle, Clock, X } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { OrderStatusSelect } from "./order-status-select";
import { OrderCancelDialog } from "./order-cancel-dialog";
import { useState } from "react";

function getStatusConfig(status: string, paymentStatus: string, paymentMethod?: string) {
  // Special handling for COD orders
  if (paymentMethod === "cod" && paymentStatus === "pending") {
    return {
      color: "bg-blue-100 text-blue-800",
      icon: CheckCircle,
      label: "Order Received",
    };
  }
  
  if (paymentStatus === "pending" || paymentStatus === "failed") {
    return {
      color:
        paymentStatus === "failed"
          ? "bg-red-100 text-red-800"
          : "bg-orange-100 text-orange-800",
      icon: paymentStatus === "failed" ? X : Clock,
      label: paymentStatus === "failed" ? "Payment Failed" : "Payment Pending",
    };
  }

  switch (status) {
    case "pending":
      return {
        color: "bg-orange-100 text-orange-800",
        icon: Clock,
        label: "Pending",
      };
    case "confirmed":
      return {
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
        label: "Confirmed",
      };
    case "processing":
      return {
        color: "bg-blue-100 text-blue-800",
        icon: Package,
        label: "Processing",
      };
    case "ready":
      return {
        color: "bg-purple-100 text-purple-800",
        icon: Package,
        label: "Ready",
      };
    case "shipped":
      return {
        color: "bg-indigo-100 text-indigo-800",
        icon: Package,
        label: "Shipped",
      };
    case "delivered":
      return {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Delivered",
      };
    case "cancelled":
      return {
        color: "bg-gray-100 text-gray-800",
        icon: X,
        label: "Cancelled",
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800",
        icon: Clock,
        label: status,
      };
  }
}

type AdminOrderDetailsModalProps = {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated?: () => void;
};

export function AdminOrderDetailsModal({ 
  orderId, 
  open, 
  onOpenChange, 
  onOrderUpdated 
}: AdminOrderDetailsModalProps) {
  const trpc = useTRPC();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data: order, isLoading, error, refetch } = useQuery({
    ...trpc.adminOrders.getOrderByIdAdmin.queryOptions({ orderId }),
    enabled: open,
  });

  const handleOrderUpdate = () => {
    refetch();
    onOrderUpdated?.();
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

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-gray-600">Failed to load order details</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const statusConfig = getStatusConfig((order as any).status, (order as any).paymentStatus, (order as any).paymentMethod);
  const customerName = (order as any).customer?.firstName && (order as any).customer?.lastName 
    ? `${(order as any).customer.firstName} ${(order as any).customer.lastName}` 
    : (order as any).billingAddress?.fullName;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Order #{(order as any).orderNumber}</span>
              <Badge className={`${statusConfig.color} hover:bg-inherit`}>
                {statusConfig.label}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Order Date</div>
                <div className="font-semibold">
                  {format(new Date((order as any).orderDate), "d MMMM yyyy")}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payment Method</div>
                <div className="font-semibold flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  {(order as any).paymentMethod === "cod" ? "Cash on Delivery" : "PesaPal"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="font-semibold text-lg">
                  {formatCurrency((order as any).total)}
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-medium">{customerName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium">{(order as any).customer.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="font-medium">{(order as any).billingAddress.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Member Since</div>
                  <div className="font-medium">
                    {(order as any).customer._createdAt 
                      ? format(new Date((order as any).customer._createdAt), "MMMM yyyy")
                      : "N/A"
                    }
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </h3>
              <div className="p-4 border rounded-lg">
                <div className="font-medium">{(order as any).billingAddress.fullName}</div>
                <div className="text-gray-600">{(order as any).billingAddress.address}</div>
                <div className="text-gray-600">{(order as any).billingAddress.city}</div>
                <div className="text-gray-600">Tel: {(order as any).billingAddress.phone}</div>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </h3>
              <div className="space-y-4">
                {(order as any).orderItems.map((item: any, index: number) => (
                  <div key={item._key || index} className="flex gap-4 p-4 border rounded-lg">
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md border bg-white">
                      <Image
                        src={
                          item.itemImage
                            ? urlFor(item.itemImage).width(80).height(64).url()
                            : `/placeholder.svg?height=64&width=80&text=${encodeURIComponent(item.name.substring(0, 10))}`
                        }
                        alt={item.name}
                        width={80}
                        height={64}
                        className="h-full w-full object-contain p-1"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Quantity: {item.quantity}
                        {item.variantSku && ` • SKU: ${item.variantSku}`}
                      </div>
                      <div className="text-sm font-medium mt-2">
                        {formatCurrency(item.unitPrice)} × {item.quantity} = {formatCurrency(item.lineTotal)}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Available
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Order Totals */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Item(s) Subtotal:</span>
                  <span>{formatCurrency((order as any).subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping & Handling:</span>
                  <span>{formatCurrency((order as any).shippingCost || 0)}</span>
                </div>
                {(order as any).orderLevelDiscount && (
                  <div className="flex justify-between text-green-600">
                    <span>Promotion applied:</span>
                    <span>-{formatCurrency((order as any).orderLevelDiscount.discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency((order as any).total)}</span>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            {(order as any).notes && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-medium text-yellow-800 mb-2">Admin Notes</div>
                <div className="text-yellow-700">{(order as any).notes}</div>
              </div>
            )}

            {/* Admin Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Update Status:</span>
                <OrderStatusSelect
                  currentStatus={(order as any).status}
                  orderId={(order as any).orderId}
                  onStatusChanged={handleOrderUpdate}
                />
              </div>
              <div className="flex gap-2">
                {(order as any).status !== "cancelled" && (order as any).status !== "delivered" && (
                  <Button 
                    variant="destructive" 
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    Cancel Order
                  </Button>
                )}
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <OrderCancelDialog
        orderId={(order as any).orderId}
        orderNumber={(order as any).orderNumber}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onOrderCancelled={handleOrderUpdate}
      />
    </>
  );
}