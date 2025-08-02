import { toast } from "sonner";

// Simple debouncing for toasts to prevent spam
class ToastManager {
  private lastToastTime = 0;
  private readonly debounceTime = 1000; // 1 second

  private shouldShowToast(): boolean {
    const now = Date.now();
    if (now - this.lastToastTime < this.debounceTime) {
      return false;
    }
    this.lastToastTime = now;
    return true;
  }

  success(message: string, options?: any) {
    if (this.shouldShowToast()) {
      toast.success(message, options);
    }
  }

  error(message: string, options?: any) {
    // Always show errors immediately (high priority)
    toast.error(message, options);
  }

  info(message: string, options?: any) {
    if (this.shouldShowToast()) {
      toast.info(message, options);
    }
  }
}

export const debouncedToast = new ToastManager();