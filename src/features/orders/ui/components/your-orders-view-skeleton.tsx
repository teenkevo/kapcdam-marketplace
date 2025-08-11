import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function YourOrdersViewSkeleton() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Breadcrumb skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Header skeleton */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-8">
        <Skeleton className="h-9 w-48" />
      </div>

      {/* Filters skeleton */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <Skeleton className="h-10 w-full md:w-80" />
          <Skeleton className="h-10 w-full md:w-48" />
        </div>
      </div>

      {/* Orders skeleton */}
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden border rounded-xl">
            <CardHeader className="bg-gray-50 p-4 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                {/* Left: Order placed date and total */}
                <div className="flex gap-12 items-center">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>

                {/* Right: Order number, status, and actions */}
                <div className="flex flex-col gap-3 text-right">
                  <div className="flex items-center justify-start sm:justify-end gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Skeleton className="h-8 w-28" />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 md:p-6">
              <div className="divide-y">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="py-4 md:py-5">
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
        ))}
      </div>
    </div>
  );
}