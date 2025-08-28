import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AdminOrdersViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Statistics Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border">
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-[180px] h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-[180px] h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Orders List Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="overflow-hidden border rounded-xl">
            <CardHeader className="bg-gray-50 p-4 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-12 items-center">
                  <div className="flex flex-col">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-24"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
                  </div>
                  <div className="flex flex-col">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-16"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-24"></div>
                  </div>
                  <div className="flex flex-col">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-20"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-36"></div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-24"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, itemIndex) => (
                  <div key={itemIndex} className="py-4 border-b last:border-b-0">
                    <div className="flex gap-4">
                      <div className="h-20 w-24 bg-gray-200 rounded-md animate-pulse shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-48"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
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