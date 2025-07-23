import z from "zod";

interface PesapalBillingAddress {
  email_address: string;
  phone_number: string;
  country_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  line_1?: string;
  line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  zip_code?: string;
}

interface PesapalSubscriptionDetails {
  start_date: string;
  end_date: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
}

export interface PesapalOrderRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  callback_url: string;
  notification_id: string;
  billing_address: PesapalBillingAddress;
  account_number?: string;
  subscription_details?: PesapalSubscriptionDetails;
}




export const submitOrderSchema = z.custom<PesapalOrderRequest>();

export const registerIpnSchema = z.object({
  url: z.string().url(),
  ipn_notification_type: z.enum(["GET", "POST"]),
});

export const refundRequestSchema = z.object({
  confirmation_code: z.string(),
  amount: z.number().positive(),
  username: z.string(),
  remarks: z.string(),
});

export const cancelOrderSchema = z.object({
  order_tracking_id: z.string().uuid(),
});

export const getTransactionStatusSchema = z.object({
  order_tracking_id: z.string().uuid(),
});
