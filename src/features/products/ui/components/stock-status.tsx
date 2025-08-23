import { cn } from "@/lib/utils";

type StockStatusProps = {
  stock: number | null | undefined;
  lowThreshold?: number; 
  className?: string;
};
export function StockStatus({
  stock,
  lowThreshold = 10,
  className,
}: StockStatusProps) {
  if (stock == null) return null;

  if (stock <= 0) {
    return (
      <p
        className={cn("mt-1 text-sm text-red-600", className)}
        role="status"
        aria-live="polite"
      >
        Out of stock
      </p>
    );
  }

  if (stock <= lowThreshold) {
    return (
      <p
        className={cn("mt-1 text-sm text-amber-600", className)}
        role="status"
        aria-live="polite"
      >
        Only {stock} left in stock. Order soon!
      </p>
    );
  }

  return null; 
}