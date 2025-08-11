import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function OrderDetailsViewSkeleton() {
  return (
    <div>
      {/* Order info above card */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex gap-8 items-center">
          <div className="flex flex-col">
            <Skeleton className="h-6 w-80" />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border rounded-xl">
        {/* Header */}
        <CardHeader className="bg-gray-50 p-4 md:p-6">
          {/* Two column layout */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column - Ship to and Payment Methods */}
            <div className="flex-1 flex items-start gap-12">
              <div className="space-y-3">
                <Skeleton className="h-5 w-16" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>

              <div className="space-y-3">
                <Skeleton className="h-5 w-28" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>

            {/* Right column - Order Summary */}
            <div className="flex-1 max-w-sm space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Steps */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-6 flex-wrap">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                  {i < 3 && <Skeleton className="w-8 h-px" />}
                </div>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <div className="divide-y">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="py-4 md:py-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  {/* Product thumbnail */}
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-20 w-24 rounded-md" />
                  </div>

                  {/* Product info */}
                  <div className="grid flex-1 gap-2">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}