"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { DeliveryZone } from "../../schemas/delivery-zone";
import { Truck } from "lucide-react";

interface DeliveryZoneSelectorProps {
  selectedAddress: {
    country: string;
  } | null;
  selectedZone: {
    _id: string;
    zoneName: string;
    fee: number;
    estimatedDeliveryTime: string;
  } | null;
  onZoneSelect: (
    zone: {
      _id: string;
      zoneName: string;
      fee: number;
      estimatedDeliveryTime: string;
    } | null
  ) => void;
  deliveryMethod: "pickup" | "local_delivery";
}

export function DeliveryZoneSelector({
  selectedAddress,
  selectedZone,
  onZoneSelect,
  deliveryMethod,
}: DeliveryZoneSelectorProps) {
  const trpc = useTRPC();

  const shouldFetchZones =
    deliveryMethod === "local_delivery" && !!selectedAddress;

  const { data: deliveryZones, isLoading } = useQuery({
    ...trpc.delivery.getZonesByCountry.queryOptions({
      country: selectedAddress?.country || "Uganda",
    }),
    enabled: shouldFetchZones,
  });

  useEffect(() => {
    if (deliveryMethod === "pickup") {
      onZoneSelect(null);
    }
  }, [deliveryMethod, onZoneSelect]);

  useEffect(() => {
    if (
      deliveryZones &&
      Array.isArray(deliveryZones) &&
      deliveryZones.length === 1 &&
      !selectedZone &&
      deliveryMethod === "local_delivery"
    ) {
      const zone = deliveryZones[0];
      if (zone) {
        onZoneSelect({
          _id: zone._id,
          zoneName: zone.zoneName,
          fee: zone.fee,
          estimatedDeliveryTime: zone.estimatedDeliveryTime,
        });
      }
    }
  }, [deliveryZones, selectedZone, deliveryMethod, onZoneSelect]);

  // Don't render anything for pickup
  if (deliveryMethod === "pickup") {
    return null;
  }

  // Don't render if no address is selected
  if (!selectedAddress) {
    return null;
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <div className="flex w-full justify-between items-center">
          <h4 className="text-xl font-semibold">Delivery Zones</h4>
        </div>

        {isLoading ? (
          <DeliveryZonesSkeleton />
        ) : !deliveryZones ||
          !Array.isArray(deliveryZones) ||
          deliveryZones.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No delivery zones available for this area</p>
            <p className="text-sm">Please contact us for delivery options</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliveryZones.map((zone) => (
              <div
                key={zone._id}
                className={`p-3 border rounded-lg transition-all cursor-pointer ${
                  selectedZone?._id === zone._id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-primary/5 hover:border-primary/50"
                }`}
                onClick={() =>
                  onZoneSelect({
                    _id: zone._id,
                    zoneName: zone.zoneName,
                    fee: zone.fee,
                    estimatedDeliveryTime: zone.estimatedDeliveryTime,
                  })
                }
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium">{zone.zoneName}</h5>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {zone.cities.join(", ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      UGX {zone.fee.toLocaleString()}
                    </div>
                    {zone.fee === 0 && (
                      <div className="text-xs text-green-600 font-medium">
                        FREE
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeliveryZonesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
