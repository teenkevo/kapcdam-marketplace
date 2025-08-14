"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Package,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { AdminOrderDetailsModal } from "./admin-order-details-modal";
import { OrderStatusSelect } from "./order-status-select";
import { OrderCancelDialog } from "./order-cancel-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

function getStatusConfig(status: string, paymentStatus: string, paymentMethod?: string) {
  // Special handling for COD orders - show order status instead of payment status
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
      icon: paymentStatus === "failed" ? AlertTriangle : Clock,
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

type AdminOrderCardProps = {
  order: {
    orderId: string;
    orderNumber: string;
    orderDate: string;
    total: number;
    paymentStatus: string;
    paymentMethod: string;
    status: string;
    deliveryMethod: string;
    customer: {
      _id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
    billingAddress: {
      _id: string;
      phone: string;
      address: string;
      city: string;
      fullName: string;
    };
    orderItems: Array<{
      _key: string;
      type: "product" | "course";
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      variantSku?: string;
      itemImage?: any;
      productId?: string;
      courseId?: string;
    }>;
    notes?: string;
  };
  onOrderUpdated?: () => void;
};

export function AdminOrderCard({ order, onOrderUpdated }: AdminOrderCardProps) {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const statusConfig = getStatusConfig(order.status, order.paymentStatus, order.paymentMethod);

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

  const customerName = order.customer.firstName && order.customer.lastName 
    ? `${order.customer.firstName} ${order.customer.lastName}` 
    : order.billingAddress.fullName;

  return (
    <>
      <Card className="overflow-hidden border rounded-xl relative">
        {/* Header */}
        <CardHeader className="bg-gray-50 p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            {/* Left: Order details */}
            <div className="flex gap-8 items-center">
              <div className="flex flex-col">
                <dt className="text-gray-600 font-medium tracking-wide text-xs">
                  ORDER PLACED
                </dt>
                <dd className="font-semibold">
                  {format(new Date(order.orderDate), "d MMMM yyyy")}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-gray-600 font-medium tracking-wide text-xs">
                  TOTAL
                </dt>
                <dd className="font-semibold">{formatCurrency(order.total)}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-gray-600 font-medium tracking-wide text-xs">
                  CUSTOMER
                </dt>
                <dd className="font-semibold flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {customerName}
                </dd>
              </div>
            </div>

            {/* Right: Order status and actions */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-start sm:justify-end gap-2">
                <span className="text-gray-600 text-sm">
                  ORDER #{order.orderNumber}
                </span>
                <Badge
                  className={`${statusConfig.color} hover:bg-inherit pointer-events-none`}
                >
                  {statusConfig.label}
                </Badge>
              </div>

              <div className="flex items-center gap-2 justify-end">
                {/* Order Status Select */}
                <OrderStatusSelect
                  currentStatus={order.status}
                  orderId={order.orderId}
                  onStatusChanged={onOrderUpdated}
                />
                
                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => setDetailsModalOpen(true)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {order.status !== "cancelled" && order.status !== "delivered" && (
                      <DropdownMenuItem 
                        onClick={() => setCancelDialogOpen(true)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Order
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Body */}
        <CardContent className="p-4 md:p-6">
          <div className="space-y-3">
            {/* Customer info */}
            <div className="flex justify-between items-start text-sm">
              <div>
                <span className="text-gray-600">Customer:</span> {order.customer.email}
              </div>
              <div>
                <span className="text-gray-600">Payment:</span> {order.paymentMethod === "cod" ? "Cash on Delivery" : "PesaPal"}
              </div>
            </div>
            
            {/* Order items summary */}
            <div className="text-sm text-gray-600">
              <span className="font-medium">{order.orderItems.length} item(s):</span>{" "}
              {order.orderItems.slice(0, 2).map(item => item.name).join(", ")}
              {order.orderItems.length > 2 && ` +${order.orderItems.length - 2} more`}
            </div>

            {/* Admin notes */}
            {order.notes && (
              <div className="text-sm p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <span className="font-medium text-yellow-800">Admin Notes:</span>
                <div className="text-yellow-700 mt-1">{order.notes}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AdminOrderDetailsModal
        orderId={order.orderId}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onOrderUpdated={onOrderUpdated}
      />

      <OrderCancelDialog
        orderId={order.orderId}
        orderNumber={order.orderNumber}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onOrderCancelled={onOrderUpdated}
      />
    </>
  );
}