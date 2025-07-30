import { z } from "zod";

// Address schema matching Sanity schema exactly
export const addressSchema = z.object({
  id: z.string(),
  label: z.enum(["home", "work", "other"], {
    required_error: "Address label is required",
  }),
  fullName: z.string(),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[+]?[0-9\s\-\(\)]{7,15}$/, "Enter a valid phone number"),
  address: z.string().min(1, "Address is required"),
  landmark: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().default("Uganda"),
  deliveryInstructions: z.string().nullable().optional(),
  isDefault: z.boolean().default(false),
});

// Checkout form schema
export const checkoutFormSchema = z.object({
  selectedAddressIndex: z.number().optional(),
  newAddress: addressSchema.optional(),
  deliveryMethod: z.enum(["pickup", "local_delivery"], {
    required_error: "Please select a delivery method",
  }),
  paymentMethod: z
    .enum(["pesapal", "cod"], {
      required_error: "Please select a payment method",
    })
    .default("pesapal"),
  orderNotes: z.string().nullable().optional(),
});

// Types
export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutFormData = {
  selectedAddress: AddressInput;
  deliveryMethod: "pickup" | "local_delivery";
  paymentMethod: "pesapal" | "cod";
  selectedDeliveryZone?: {
    _id: string;
    zoneName: string;
    fee: number;
    estimatedDeliveryTime: string;
  } | null;
  orderNotes?: string;
};

// Form input type (what the form actually handles)
export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;

// Extended address type (includes index for array operations)
export interface AddressWithIndex extends AddressInput {
  index?: number;
}

// User with addresses schema for tRPC output validation
export const userWithAddressesSchema = z.object({
  _id: z.string(),
  clerkUserId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  addresses: z.array(addressSchema).default([]),
});

// User with addresses type
export type UserWithAddresses = z.infer<typeof userWithAddressesSchema>;
