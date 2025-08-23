// Email Service
export { OrderEmailService } from "./email-service";
export type {
  OrderCancellationEmailData,
  UserEmailData,
} from "./email-service";
// Email templates
export { default as OrderConfirmationCODEmail } from "../ui/emails/order-confirmation-cod";
export { default as AdminOrderConfirmationCODEmail } from "../ui/emails/order-confirmation-cod-admin";

export { default as OrderCancellationEmail } from "../ui/emails/order-cancelled";
export { default as AdminOrderCancellationEmail } from "../ui/emails/order-cancellation-admin";
export { transformOrderForEmail, transformUserForEmail, sendOrderCancellationEmail } from "./email-utils";


