"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useLocalCartStore } from "../../store/use-local-cart-store";
import { useUser } from "@clerk/nextjs";
import { CartNavButton, CartNavButtonLocal } from "./cart-nav-button";

export function CartBubble({ totalItems }: { totalItems: number }) {
  const { isSignedIn } = useUser();
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isSignedIn ? (
        <CartNavButton totalItems={totalItems} />
      ) : (
        <CartNavButtonLocal />
      )}
    </div>
  );
}
