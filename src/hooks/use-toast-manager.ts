import { useRef, useCallback } from 'react';
import { toast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  timestamp: number;
}

/**
 * Hook for managing toast messages with deduplication and smart queuing
 */
export function useToastManager() {
  const recentToasts = useRef<ToastMessage[]>([]);
  const DEDUPLICATION_WINDOW = 2000; // 2 seconds
  const MAX_RECENT_TOASTS = 5;

  const generateToastId = useCallback((type: ToastType, message: string): string => {
    return `${type}-${message.toLowerCase().replace(/\s+/g, '-')}`;
  }, []);

  const cleanupOldToasts = useCallback(() => {
    const now = Date.now();
    recentToasts.current = recentToasts.current.filter(
      toast => now - toast.timestamp < DEDUPLICATION_WINDOW
    );
  }, []);

  const isDuplicate = useCallback((id: string): boolean => {
    cleanupOldToasts();
    return recentToasts.current.some(toast => toast.id === id);
  }, [cleanupOldToasts]);

  const addToRecent = useCallback((id: string, type: ToastType, message: string) => {
    const newToast: ToastMessage = {
      id,
      type,
      message,
      timestamp: Date.now()
    };

    recentToasts.current = [newToast, ...recentToasts.current.slice(0, MAX_RECENT_TOASTS - 1)];
  }, []);

  const showToast = useCallback((
    type: ToastType,
    message: string,
    options: ToastOptions = {}
  ) => {
    const id = generateToastId(type, message);

    // Prevent duplicate toasts within the deduplication window
    if (isDuplicate(id)) {
      return;
    }

    // Add to recent toasts tracking
    addToRecent(id, type, message);

    // Show the toast based on type
    switch (type) {
      case 'success':
        return toast.success(message, {
          id,
          description: options.description,
          duration: options.duration,
          action: options.action,
        });
      case 'error':
        return toast.error(message, {
          id,
          description: options.description,
          duration: options.duration,
          action: options.action,
        });
      case 'info':
        return toast.info(message, {
          id,
          description: options.description,
          duration: options.duration,
          action: options.action,
        });
      case 'warning':
        return toast.warning(message, {
          id,
          description: options.description,
          duration: options.duration,
          action: options.action,
        });
      default:
        return toast(message, {
          id,
          description: options.description,
          duration: options.duration,
          action: options.action,
        });
    }
  }, [generateToastId, isDuplicate, addToRecent]);

  // Convenience methods
  const success = useCallback((message: string, options?: ToastOptions) => {
    return showToast('success', message, options);
  }, [showToast]);

  const error = useCallback((message: string, options?: ToastOptions) => {
    return showToast('error', message, options);
  }, [showToast]);

  const info = useCallback((message: string, options?: ToastOptions) => {
    return showToast('info', message, options);
  }, [showToast]);

  const warning = useCallback((message: string, options?: ToastOptions) => {
    return showToast('warning', message, options);
  }, [showToast]);

  // Method to dismiss similar toasts before showing new ones
  const dismissSimilar = useCallback((type: ToastType, messagePattern: string) => {
    const id = generateToastId(type, messagePattern);
    toast.dismiss(id);
  }, [generateToastId]);

  // Method to dismiss all toasts
  const dismissAll = useCallback(() => {
    toast.dismiss();
    recentToasts.current = [];
  }, []);

  return {
    success,
    error,
    info,
    warning,
    showToast,
    dismissSimilar,
    dismissAll,
  };
}