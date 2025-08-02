import { useCallback } from 'react';
import { useToastManager } from '@/hooks/use-toast-manager';

type CartOperation = 'add' | 'update' | 'remove' | 'sync' | 'checkout';

interface CartToastOptions {
  itemName?: string;
  quantity?: number;
  isSignedIn?: boolean;
  skipDuplicateCheck?: boolean;
}

/**
 * Specialized hook for cart-related toast messages with smart deduplication
 */
export function useCartToasts() {
  const { success, error, dismissSimilar } = useToastManager();

  const showCartSuccess = useCallback((
    operation: CartOperation,
    options: CartToastOptions = {}
  ) => {
    const { itemName, quantity, isSignedIn = false } = options;

    // Dismiss any existing cart operation toasts before showing new ones
    dismissSimilar('success', 'cart');

    switch (operation) {
      case 'add':
        return success(
          quantity && quantity > 1 ? 'Items added to cart!' : 'Added to cart!',
          {
            description: isSignedIn 
              ? 'Item successfully added to your cart'
              : 'Sign in to sync your cart across devices',
            duration: 3000,
          }
        );

      case 'update':
        return success('Quantity updated!', {
          description: 'Item quantity updated in cart',
          duration: 2500,
        });

      case 'remove':
        return success('Item removed from cart', {
          description: itemName ? `${itemName} removed from your cart` : undefined,
          duration: 2500,
        });

      case 'sync':
        const itemText = quantity === 1 ? 'item' : 'items';
        return success(
          quantity && quantity > 0 
            ? `${quantity} ${itemText} synced to your account!`
            : 'Cart synced successfully!',
          {
            description: 'Your local cart has been synced with your account',
            duration: 4000,
          }
        );

      case 'checkout':
        return success('Order created successfully!', {
          description: 'Redirecting to payment...',
          duration: 3000,
        });

      default:
        return success('Cart updated successfully!', {
          duration: 2500,
        });
    }
  }, [success, dismissSimilar]);

  const showCartError = useCallback((
    operation: CartOperation,
    errorMessage: string,
    options: CartToastOptions = {}
  ) => {
    // Dismiss any existing error toasts
    dismissSimilar('error', 'cart');

    switch (operation) {
      case 'add':
        return error('Failed to add to cart', {
          description: errorMessage,
          duration: 5000,
        });

      case 'update':
        return error('Failed to update cart', {
          description: errorMessage,
          duration: 5000,
        });

      case 'remove':
        return error('Failed to remove item', {
          description: errorMessage,
          duration: 5000,
        });

      case 'sync':
        return error('Failed to sync cart', {
          description: errorMessage,
          duration: 6000,
        });

      case 'checkout':
        return error('Failed to create order', {
          description: errorMessage,
          duration: 6000,
        });

      default:
        return error('Cart operation failed', {
          description: errorMessage,
          duration: 5000,
        });
    }
  }, [error, dismissSimilar]);

  // Specialized methods for common cart operations
  const addToCartSuccess = useCallback((isSignedIn: boolean, quantity = 1) => {
    return showCartSuccess('add', { isSignedIn, quantity });
  }, [showCartSuccess]);

  const updateQuantitySuccess = useCallback(() => {
    return showCartSuccess('update');
  }, [showCartSuccess]);

  const removeItemSuccess = useCallback((itemName?: string) => {
    return showCartSuccess('remove', { itemName });
  }, [showCartSuccess]);

  const syncSuccess = useCallback((itemsAdded: number) => {
    return showCartSuccess('sync', { quantity: itemsAdded });
  }, [showCartSuccess]);

  const addToCartError = useCallback((errorMessage: string) => {
    return showCartError('add', errorMessage);
  }, [showCartError]);

  const updateCartError = useCallback((errorMessage: string) => {
    return showCartError('update', errorMessage);
  }, [showCartError]);

  const syncError = useCallback((errorMessage: string) => {
    return showCartError('sync', errorMessage);
  }, [showCartError]);

  return {
    // Generic methods
    showCartSuccess,
    showCartError,
    
    // Specific cart operation methods
    addToCartSuccess,
    updateQuantitySuccess,
    removeItemSuccess,
    syncSuccess,
    addToCartError,
    updateCartError,
    syncError,
  };
}