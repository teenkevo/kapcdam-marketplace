import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ProductsHeaderSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
        </div>
      </div>

      {/* Mobile Search Input */}
      <div className="relative flex-grow md:hidden">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Controls Row: Category, Search, Sort */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Type Buttons */}
        <div
          className={cn(
            "flex-shrink-0 flex items-center gap-2 w-full sm:w-auto"
          )}
        >
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Category Button Skeleton */}
        <div className="flex-shrink-0">
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Desktop Search Input */}
        <div className="relative flex-grow hidden md:block">
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Sort Select */}
        <div className="flex-shrink-0">
          <Skeleton className="h-10 w-48" />
        </div>
      </div>
    </div>
  );
}
