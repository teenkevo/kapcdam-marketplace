import Image from 'next/image';
import React from 'react'
import { NumericFormat } from 'react-number-format';
import { CartDisplayProductType } from '../../schema';
import { urlFor } from '@/sanity/lib/image';
import { getDisplayTitle } from '../../helpers';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const CartDisplayItem = ({item}: {item: CartDisplayProductType}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

 
   const updateServerCartMutation = useMutation(
     trpc.cart.updateCartItem.mutationOptions({
       onSuccess: () => {
         queryClient.invalidateQueries(trpc.cart.getUserCart.queryOptions());
         toast.success("Cart updated successfully!");
       },
       onError: (error) => {
         toast.error(`Failed to update cart: ${error.message}`);
       },
     })
   );

     const handleUpdateQuantity = (itemIndex: number, newQuantity: number) => {
       if (!userCart?._id) return;
       updateServerCartMutation.mutate({
         cartId: userCart._id,
         itemIndex,
         quantity: newQuantity,
       });
     };

     
  return (
    <div
      className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg"
    >
      <Image
        src={urlFor(item.defaultImage).width(80).height(80).url()}
        alt={item.title}
        width={64}
        height={64}
        className="w-16 h-16 object-cover rounded-md"
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {getDisplayTitle(item.title, "product", item.variants?.[0])}
        </h4>
        <p className="text-sm text-gray-500">Kapcdam Marketplace</p>
        <div className="flex items-center">
          <NumericFormat
            thousandSeparator={true}
            displayType="text"
            prefix="UGX "
            value={1000}
            className="text-sm font-semibold"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
          disabled={updateServerCartMutation.isPending || isSyncing}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-sm font-medium w-8 text-center">
          {item.quantity}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
          disabled={updateServerCartMutation.isPending || isSyncing}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleRemoveItem(index)}
          disabled={updateServerCartMutation.isPending || isSyncing}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default CartDisplayItem