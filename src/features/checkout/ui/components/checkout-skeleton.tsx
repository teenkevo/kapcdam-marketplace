import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AddressSkeleton() {
  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <div className="flex w-full justify-between items-center">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-16" />
        </div>

        <div className="p-3 border rounded bg-gray-50 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DeliveryMethodSkeleton() {
  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <Skeleton className="h-7 w-36" />

        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex w-full justify-between items-center">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex w-full justify-between items-center">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PaymentMethodSkeleton() {
  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <Skeleton className="h-7 w-36" />

        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex w-full justify-between items-center">
                <div>
                  <Skeleton className="h-5 w-16 mb-1" />
                  <Skeleton className="h-4 w-44" />
                </div>
                <div className="flex items-center gap-1">
                  <Skeleton className="w-8 h-6" />
                  <Skeleton className="w-8 h-6" />
                  <Skeleton className="w-8 h-6" />
                  <Skeleton className="w-8 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex w-full justify-between items-center">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OrderNotesSkeleton() {
  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}

export function DeliveryZonesSkeleton() {
  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <div className="flex w-full justify-between items-center">
          <Skeleton className="h-7 w-32" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CheckoutFormSkeleton() {
  return (
    <div className="space-y-6">
      <AddressSkeleton />
      <DeliveryMethodSkeleton />
      <DeliveryZonesSkeleton />
      <PaymentMethodSkeleton />
      <OrderNotesSkeleton />
    </div>
  );
}

export function OrderSummarySkeleton() {
  return (
    <Card>
      <CardContent className="py-6 space-y-6">
        <Skeleton className="h-7 w-32" />

        <div className="space-y-4">
          {/* Product items */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-16 w-16 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-20" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between font-medium">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>

        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}
