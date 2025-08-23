// Email Service
export { OrderEmailService } from "./email-service";
export type {
  OrderCancellationEmailData,
  UserEmailData,
} from "./email-service";

export { default as OrderCancellationEmail } from "../ui/emails/order-cancelled";
export { default as AdminOrderCancellationEmail } from "../ui/emails/order-cancellation-admin";

export {
  transformOrderForEmail,
  transformUserForEmail,
  sendOrderCancellationEmail,
} from "./email-utils";


