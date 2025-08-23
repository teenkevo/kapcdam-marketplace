"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Calendar as CalendarIcon,
  ShoppingCart,
  CheckCircle,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useLocalCartStore } from "@/features/cart/store/use-local-cart-store";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CartItemType } from "@/features/cart/schema";
import { useUser } from "@clerk/nextjs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";

interface CourseEnrollmentButtonProps {
  courseId: string;
}

export function CourseEnrollmentButton({
  courseId,
}: CourseEnrollmentButtonProps) {
  const { isSignedIn } = useUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { addLocalCartItem, isInCart } = useLocalCartStore();

  // Check if user is an admin
  const { data: adminProfile, isLoading: isLoadingAdmin } = useQuery({
    ...trpc.adminUser.getProfile.queryOptions(),
    enabled: isSignedIn,
    retry: false,
    // If this fails, user is likely not an admin
  });

  const isAdmin = !!adminProfile && !isLoadingAdmin;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [preferredStartDate, setPreferredStartDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Get user cart if signed in
  const { data: userCart } = useQuery({
    ...trpc.cart.getUserCart.queryOptions(),
    enabled: isSignedIn && !isAdmin,
  });

  // Check if course is already in cart
  useEffect(() => {
    if (isSignedIn && userCart) {
      // Check server cart for signed-in users
      const courseInCart = userCart.cartItems?.some(
        (cartItem: any) =>
          cartItem.courseId === courseId || cartItem.course?._ref === courseId
      );
      setIsEnrolled(courseInCart || false);
    } else {
      // Check local cart for guest users
      const courseInLocalCart = isInCart(undefined, courseId);
      setIsEnrolled(courseInLocalCart);
    }
  }, [userCart, courseId, isSignedIn, isInCart]);

  // Add to cart mutation for signed-in users
  const addToCartMutation = useMutation(
    trpc.cart.addToCart.mutationOptions({
      onSuccess: () => {
        // Invalidate cart queries to refresh data
        queryClient.invalidateQueries(trpc.cart.getUserCart.queryOptions());
        queryClient.invalidateQueries({
          queryKey: ["cart", "getDisplayData"],
        });

        toast.success("Course added to cart successfully!");
        setIsDialogOpen(false);
        setPreferredStartDate("");
      },
      onError: (error) => {
        toast.error(`Failed to add course to cart: ${error.message}`);
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    })
  );

  const handleEnrollment = async () => {
    if (isEnrolled) {
      toast.info("You're already enrolled in this course!");
      return;
    }

    if (!preferredStartDate) {
      toast.error("Please select your preferred start date");
      return;
    }

    setIsSubmitting(true);

    try {
      const cartItem: CartItemType = {
        type: "course",
        productId: null,
        courseId: courseId,
        selectedVariantSku: null,
        quantity: 1,
        preferredStartDate: new Date(preferredStartDate).toISOString(),
      };

      if (isSignedIn && userCart) {
        // Add to server cart
        await addToCartMutation.mutateAsync(cartItem);
      } else {
        // Add to local cart (toast handled by local cart store)
        addLocalCartItem({
          type: "course",
          productId: null,
          courseId: courseId,
          selectedVariantSku: null,
          quantity: 1,
          preferredStartDate: cartItem.preferredStartDate,
        });

        setIsDialogOpen(false);
        setPreferredStartDate("");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Failed to add course to cart:", error);
      setIsSubmitting(false);
    }
  };

  const handleButtonClick = () => {
    if (isEnrolled) {
      toast.info("You're already enrolled in this course!");
      return;
    }
    setIsDialogOpen(true);
  };

  // Get today's date for min date validation
  const today = new Date().toISOString().split("T")[0];

  // If admin, show disabled button with tooltip
  if (isAdmin) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
              disabled
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Admin Access Restricted
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Course enrollment is only available to customers</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          className={`w-full ${
            isEnrolled
              ? "bg-[#C5F82A]/50 text-black/80 cursor-default"
              : "bg-[#C5F82A] text-black hover:bg-[#B4E729]"
          }`}
          disabled={isEnrolled}
          onClick={handleButtonClick}
        >
          {isEnrolled ? (
            <>In cart</>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Enroll Now
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex gap-2">
            <CalendarIcon className="w-5 h-5" />
            Course Enrollment
          </DialogTitle>
          <DialogDescription className="text-start">
            Select your preferred start date for this course. This helps us
            better plan the course schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="preferred-date" className="text-sm font-medium">
              Preferred Start Date *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  data-empty={!preferredStartDate}
                  className="data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal"
                >
                  <CalendarIcon />
                  {preferredStartDate ? (
                    format(new Date(preferredStartDate), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={
                    preferredStartDate
                      ? new Date(preferredStartDate)
                      : undefined
                  }
                  onSelect={(date) =>
                    date &&
                    setPreferredStartDate(date.toISOString().split("T")[0])
                  }
                  fromDate={new Date()}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-gray-500">
              Note: The actual course start date may differ based on enrollment
              and scheduling.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsDialogOpen(false);
              setPreferredStartDate("");
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnrollment}
            disabled={!preferredStartDate || isSubmitting}
            className="bg-[#C5F82A] text-black hover:bg-[#B4E729]"
          >
            {isSubmitting ? (
              <>Adding to Cart...</>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
