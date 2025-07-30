import { z } from "zod";

// Address schema matching form requirements (nullable fields handled in API layer)
export const addressSchema = z.object({
  _id: z.string().optional(), // Optional for new addresses
  label: z.enum(["home", "work", "other"], {
    required_error: "Address label is required",
  }),
  fullName: z.string().min(2, "Full name is required (minimum 2 characters)"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[+]?[0-9\s\-\(\)]{7,15}$/, "Enter a valid phone number"),
  address: z
    .string()
    .min(5, "Street address is required (minimum 5 characters)"),
  landmark: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Uganda"),
  deliveryInstructions: z.string().optional(),
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
});

// Types
export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutFormData = {
  selectedAddress: { addressId: string }; // Only support existing addresses
  deliveryMethod: "pickup" | "local_delivery";
  paymentMethod: "pesapal" | "cod";
  selectedDeliveryZone?: {
    _id: string;
    zoneName: string;
    fee: number;
    estimatedDeliveryTime: string;
  } | null;
};

// Form input type (what the form actually handles)
export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;

// Extended address type (includes index for array operations)
export interface AddressWithIndex extends AddressInput {
  index?: number;
}
