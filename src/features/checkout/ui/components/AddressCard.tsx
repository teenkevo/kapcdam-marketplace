"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Edit2 } from "lucide-react";
import { type AddressInput } from "../../schemas/checkout-form";
import AddressForm from "./AddressForm";

interface AddressCardProps {
  address: AddressInput;
  index: number;
  isSelected?: boolean;
  showRadio?: boolean;
  onSelect?: (index: number) => void;
  onEdit?: (index: number, address: AddressInput) => void;
  isLoading?: boolean;
}

export default function AddressCard({
  address,
  index,
  isSelected = false,
  showRadio = true,
  onSelect,
  onEdit,
  isLoading = false,
}: AddressCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleEditSubmit = (updatedAddress: AddressInput) => {
    onEdit?.(index, updatedAddress);
    setIsEditing(false);
  };

  const labelText = address.label.toUpperCase();

  if (isEditing) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Edit Address</h4>
          </div>
          <AddressForm
            defaultValues={address}
            onSubmit={handleEditSubmit}
            onCancel={handleEditCancel}
            isLoading={isLoading}
            submitText="Update Address"
          />
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`cursor-pointer transition-all hover:bg-muted/50 ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={() => onSelect?.(index)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {showRadio && (
            <RadioGroupItem
              value={index.toString()}
              className="mt-1"
              checked={isSelected}
            />
          )}

          <div className="flex-1 space-y-2">
            {/* Address Label and Default Badge */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{labelText}</span>
              {address.isDefault && (
                <Badge variant="secondary" className="text-xs">
                  Default
                </Badge>
              )}
            </div>

            {/* Address Text */}
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p>{address.address}</p>
                {address.landmark && (
                  <p className="text-xs">Near {address.landmark}</p>
                )}
                {address.city && <p className="text-xs">{address.city}</p>}
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{address.phone}</span>
            </div>

            {/* Delivery Instructions */}
            {address.deliveryInstructions && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                <strong>Delivery Notes:</strong> {address.deliveryInstructions}
              </div>
            )}
          </div>

          {/* Edit Button */}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              disabled={isLoading}
              className="flex-shrink-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
