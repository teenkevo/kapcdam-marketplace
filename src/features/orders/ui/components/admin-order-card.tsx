"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  ChevronDown,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { format } from "date-fns";
import { OrderStatusSelect } from "./order-status-select";
import { OrderCancelDialog } from "./order-cancel-dialog";
import { OrderProcessButton } from "./order-process-button";
import { OrderReadyButton } from "./order-ready-button";
import { OrderDeliveredButton } from "./order-delivered-button";
import { OrderCancelActions } from "./order-cancel-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { urlFor } from "@/sanity/lib/image";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminOrderResponse } from "../../schema";
import { getPreviousStatus } from "../../schema";
import { cn } from "@/lib/utils";
import Image from "next/image";

function getStatusConfig(
  status: string,
  paymentStatus: string,
  paymentMethod?: string
) {
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

function getPaymentStatusConfig(paymentStatus: string) {
  switch (paymentStatus) {
    case "paid":
      return {
        color: "bg-green-100 text-green-800",
        label: "Paid",
      };
    case "pending":
      return {
        color: "bg-orange-100 text-orange-800",
        label: "Pending",
      };
    case "failed":
      return {
        color: "bg-red-100 text-red-800",
        label: "Failed",
      };
    case "refunded":
      return {
        color: "bg-purple-100 text-purple-800",
        label: "Refunded",
      };
    case "not_initiated":
      return {
        color: "bg-gray-100 text-gray-800",
        label: "Not Initiated",
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800",
        label: paymentStatus,
      };
  }
}

function parseCancellationInfo(notes: string | null) {
  if (!notes) return null;
  
  // Look for customer cancellation pattern: [CUSTOMER CANCELLATION - REASON]
  const customerMatch = notes.match(/\[CUSTOMER CANCELLATION - (.+?)\]/);
  if (customerMatch) {
    const reason = customerMatch[1].toLowerCase().replace(/ /g, '_');
    const reasonLabels: Record<string, string> = {
      'changed_mind': 'Changed their mind',
      'found_better_price': 'Found a better price',
      'no_longer_needed': 'No longer needed',
      'ordered_by_mistake': 'Ordered by mistake',
      'delivery_too_long': 'Delivery taking too long',
      'other': 'Other reason'
    };
    
    return {
      type: 'customer' as const,
      reason: reasonLabels[reason] || reason,
      notes: notes.replace(/\[CUSTOMER CANCELLATION - .+?\]\s*/, '').trim() || null
    };
  }
  
  // Look for admin cancellation pattern: [ADMIN CANCELLATION - REASON]
  const adminMatch = notes.match(/\[ADMIN CANCELLATION - (.+?)\]/);
  if (adminMatch) {
    return {
      type: 'admin' as const,
      reason: adminMatch[1].replace(/_/g, ' ').toLowerCase(),
      notes: notes.replace(/\[ADMIN CANCELLATION - .+?\]\s*/, '').trim() || null
    };
  }
  
  return null;
}

type AdminOrderCardProps = {
  order: AdminOrderResponse;
  onOrderUpdated?: () => void;
  isActive?: boolean;
};

function ItemAvailabilitySelect({
  productId,
  variantSku,
  itemName,
}: {
  productId: string | null;
  variantSku: string | null;
  itemName: string;
}) {
  const [isAvailable, setIsAvailable] = useState(true); // Default to Available (green)
  const trpc = useTRPC();
  
  const updateAvailability = useMutation(
    trpc.adminOrders.updateProductAvailability.mutationOptions({
      onSuccess: () => {
        toast.success("Product availability updated");
      },
      onError: (error) => {
        // Revert optimistic update on error
        setIsAvailable(!isAvailable);
        toast.error(error.message || "Failed to update availability");
      },
    })
  );

  const handleAvailabilityChange = (value: string) => {
    if (!productId || updateAvailability.isPending) return;
    
    const newAvailability = value === "available";
    
    // Optimistic update
    setIsAvailable(newAvailability);
    
    updateAvailability.mutate({
      productId,
      variantSku,
      available: newAvailability,
    });
  };

  if (!productId) return null;

  const currentValue = isAvailable ? "available" : "unavailable";
  const triggerColorClass = isAvailable 
    ? "bg-green-100 text-green-800 border-green-200" 
    : "bg-red-100 text-red-800 border-red-200";

  return (
    <Select 
      value={currentValue} 
      onValueChange={handleAvailabilityChange}
      disabled={updateAvailability.isPending}
    >
      <SelectTrigger className={cn(
        "w-[110px] h-7 text-xs font-medium shadow-none",
        triggerColorClass,
        updateAvailability.isPending && "opacity-50"
      )}>
        <SelectValue>
          {updateAvailability.isPending ? "Updating..." : (isAvailable ? "Available" : "Unavailable")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="available" className="text-xs">
          Available
        </SelectItem>
        <SelectItem value="unavailable" className="text-xs">
          Unavailable
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export function AdminOrderCard({
  order,
  onOrderUpdated,
  isActive,
}: AdminOrderCardProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);

  const statusConfig = getStatusConfig(
    order.status,
    order.paymentStatus,
    order.paymentMethod
  );

  const paymentStatusConfig = getPaymentStatusConfig(order.paymentStatus);

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

  const customerName =
    order.customer.firstName && order.customer.lastName
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : order.billingAddress.fullName;

  return (
    <>
      <AccordionItem value={order.orderId}>
        <Card className="overflow-hidden border rounded-xl relative">
          {/* Header */}
          <CardHeader className=" p-4 md:p-6 ">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              {/* Left: Order details */}
              <div className="flex gap-8 items-center">
                <div className="flex flex-col">
                  <dt className="text-gray-600 font-medium tracking-wide text-xs">
                    ORDER
                  </dt>
                  <dd className="font-medium text-sm">{order.orderNumber}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-gray-600 font-medium tracking-wide text-xs">
                    ORDER PLACED
                  </dt>
                  <dd className="font-medium text-sm">
                    {format(new Date(order.orderDate), "d MMMM yyyy")}
                  </dd>
                </div>

                <div className="flex flex-col">
                  <dt className="text-gray-600 font-medium tracking-wide text-xs">
                    Payment Method
                  </dt>
                  <dd className="font-medium text-sm flex items-center gap-1">
                    {order.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : "PesaPal"}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-gray-600 font-medium tracking-wide text-xs">
                    Payment
                  </dt>
                  <dd className="font-medium text-sm flex items-center gap-1">
                    <Badge
                      className={`${paymentStatusConfig.color} hover:bg-inherit pointer-events-none font-medium text-sm text-black shadow-none`}
                    >
                      {paymentStatusConfig.label}
                    </Badge>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-gray-600 font-medium tracking-wide text-xs">
                    Status
                  </dt>
                  <dd className="font-medium text-sm flex items-center gap-1">
                    <Badge
                      className={`${statusConfig.color} hover:bg-inherit pointer-events-none font-medium text-sm text-black shadow-none`}
                    >
                      {statusConfig.label}
                    </Badge>
                  </dd>
                </div>
              </div>
              {/* Right: Order status and actions */}
              <div className="flex flex-row gap-8">
                <div className="flex items-center justify-start sm:justify-end gap-2">
                  <div className="flex flex-col">
                    <dt className="text-gray-600 font-medium tracking-wide text-xs">
                      TOTAL
                    </dt>
                    <dd className="font-semibold">
                      {formatCurrency(order.total)}
                    </dd>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  {/* Action buttons based on order status */}
                  {isActive ? (
                    <>
                      {order.status === "confirmed" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelDialogOpen(true)}
                          >
                            Cancel Order
                          </Button>
                          
                          {/* Only show Process Order button if payment conditions are met */}
                          {(order.paymentMethod === "cod" || 
                            (order.paymentMethod === "pesapal" && order.paymentStatus === "paid")) && (
                            <OrderProcessButton
                              orderId={order.orderId}
                              orderNumber={order.orderNumber}
                              onOrderUpdated={onOrderUpdated}
                            />
                          )}
                          
                          {/* Show payment status indicators for PesaPal orders */}
                          {order.paymentMethod === "pesapal" && order.paymentStatus === "pending" && (
                            <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-1.5 rounded-md border border-orange-200">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">Waiting for payment confirmation</span>
                            </div>
                          )}
                          
                          {order.paymentMethod === "pesapal" && order.paymentStatus === "failed" && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-md border border-red-200">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="font-medium">Payment failed - cannot process</span>
                            </div>
                          )}
                        </>
                      )}
                      
                      {order.status === "processing" && (
                        <>
                          <OrderReadyButton
                            orderId={order.orderId}
                            orderNumber={order.orderNumber}
                            deliveryMethod={order.deliveryMethod}
                            onOrderUpdated={onOrderUpdated}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setCancelDialogOpen(true)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}

                      {(order.status === "ready" || order.status === "shipped") && (
                        <>
                          <OrderDeliveredButton
                            orderId={order.orderId}
                            orderNumber={order.orderNumber}
                            deliveryMethod={order.deliveryMethod}
                            onOrderUpdated={onOrderUpdated}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setCancelDialogOpen(true)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}

                      {order.status === "cancelled" && (
                        <OrderCancelActions
                          orderId={order.orderId}
                          orderNumber={order.orderNumber}
                          previousStatus={getPreviousStatus(order.orderHistory)}
                          total={order.total}
                          onOrderUpdated={onOrderUpdated}
                        />
                      )}

                      {(order.status === "delivered") && (
                        <OrderCancelActions
                          orderId={order.orderId}
                          orderNumber={order.orderNumber}
                          previousStatus={getPreviousStatus(order.orderHistory)}
                          total={order.total}
                          onOrderUpdated={onOrderUpdated}
                        />
                      )}

                      {(order.status === "pending") && (
                        <>
                          <OrderStatusSelect
                            currentStatus={order.status}
                            orderId={order.orderId}
                            onStatusChanged={onOrderUpdated}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setCancelDialogOpen(true)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </>
                  ) : (
                    <AccordionTrigger
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "w-fit"
                      )}
                    >
                      View Order
                    </AccordionTrigger>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Body */}
          <AccordionContent>
            <CardContent className="p-2 ">
              <div className="space-y-2 bg-[#F5F5F5] rounded-lg p-1">
                {/* Table Header */}
                <div className="grid grid-cols-8 gap-4 px-4 py-3 text-sm font-medium text-gray-600 rounded-md">
                  <div className="text-center">#</div>
                  <div className="col-span-3">Product</div>
                  <div className="text-center">Quantity</div>
                  <div className="text-center">Agreed Price</div>
                  <div className="text-center">Subtotal</div>
                  <div className="text-center">Actions</div>
                </div>

                {/* Order Items */}
                {order.orderItems.map((item, index) => (
                  <div
                    key={item._key}
                    className="grid grid-cols-8 place-items-center gap-4 px-4 py-3 text-sm bg-white rounded-md border"
                  >
                    {/* Index */}
                    <div className="text-center font-medium text-gray-900">
                      {index + 1}
                    </div>

                    {/* Product (Image + Title) */}
                    <div className="flex items-center w-full col-span-3 space-x-3">
                      {item.itemImage && (
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={
                              urlFor(item.itemImage)
                                ?.width(48)
                                .height(48)
                                .url() || ""
                            }
                            alt={item.name}
                            className="w-full h-full object-cover"
                            width={48}
                            height={48}
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900">
                          {item.name}
                        </div>
                        {item.variantSku && (
                          <div className="text-xs text-gray-500 mt-1">
                            SKU: {item.variantSku}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="text-center font-medium text-gray-900">
                      {item.quantity}
                    </div>

                    {/* Agreed Price */}
                    <div className="text-center font-medium text-gray-900">
                      {formatCurrency(item.unitPrice)}
                    </div>

                    {/* Subtotal */}
                    <div className="text-center font-medium text-gray-900">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </div>

                    {/* Actions */}
                    <div className="text-center">
                      <ItemAvailabilitySelect
                        productId={item.productId}
                        variantSku={item.variantSku}
                        itemName={item.name}
                      />
                    </div>
                  </div>
                ))}

              </div>

              {/* Cancellation Information - Show for cancelled orders */}
              {order.status === "cancelled" && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  {(() => {
                    const cancellationInfo = parseCancellationInfo(order.notes);
                    if (!cancellationInfo) return null;
                    
                    return (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-semibold text-red-800 mb-1">
                              Order Cancelled {cancellationInfo.type === 'customer' ? 'by Customer' : 'by Admin'}
                            </div>
                            <div className="text-sm text-red-700 mb-2">
                              <strong>Reason:</strong> {cancellationInfo.reason}
                            </div>
                            {cancellationInfo.notes && (
                              <div className="text-sm text-red-700">
                                <strong>Additional details:</strong> {cancellationInfo.notes}
                              </div>
                            )}
                            {cancellationInfo.type === 'customer' && (
                              <div className="mt-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                Customer-initiated cancellation
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Customer Details Footer - Always visible for confirmed and above orders */}
              {(order.status !== "pending" && order.status !== "cancelled") && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <Collapsible open={customerDetailsOpen} onOpenChange={setCustomerDetailsOpen}>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">Customer Details</span>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", customerDetailsOpen && "rotate-180")} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        {/* Customer Info */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium text-sm">{customerName}</div>
                              <div className="text-xs text-gray-500">Customer</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium text-sm">{order.customer.email}</div>
                              <div className="text-xs text-gray-500">Email</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium text-sm">{order.billingAddress.phone}</div>
                              <div className="text-xs text-gray-500">Phone</div>
                            </div>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-medium text-sm mb-1">Delivery Address</div>
                              <div className="text-sm text-gray-700 leading-relaxed">
                                {order.billingAddress.address}<br />
                                {order.billingAddress.city}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {order.deliveryMethod === "pickup" ? "Pickup" : "Local Delivery"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Cancel Dialog */}
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
