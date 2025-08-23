import { Resend } from "resend";
import { render } from "@react-email/render";
import OrderCancellationEmail from "../ui/emails/order-cancelled";
import AdminOrderCancellationEmail from "../ui/emails/order-cancellation-admin";
import OrderConfirmationCODEmail from "../ui/emails/order-confirmation-cod";
import AdminOrderConfirmationCODEmail from "../ui/emails/order-confirmation-cod-admin";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface OrderCancellationEmailData {
  orderNumber: string;
  orderStatus: "CANCELLED_BY_CUSTOMER" | "CANCELLED_BY_ADMIN";
  paymentMethod: "COD" | "PESAPAL";
  paymentStatus: "NOT_INITIATED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  orderItems: {
    productName: string;
    quantity: number;
    productPrice: number;
  }[];
  subtotal: number;
  total: number;
}

export interface UserEmailData {
  firstName: string;
  email: string;
}

export class OrderEmailService {
  private static getFromAddress(): string {
    return process.env.FROM_EMAIL || "noreply@kapcdam.org";
  }

  /**
   * Send order cancellation email to customer
   */
  static async sendOrderCancellationEmail(
    orderData: OrderCancellationEmailData,
    userData: UserEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check if Resend API key is configured
      if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not configured, skipping email send");
        return {
          success: false,
          error: "Email service not configured",
        };
      }

      // Render the email template
      const emailHtml = await render(
        OrderCancellationEmail({
          order: orderData,
          user: userData,
        })
      );

      // Send email using Resend
      const result = await resend.emails.send({
        from: OrderEmailService.getFromAddress(),
        to: userData.email,
        subject: `Order #${orderData.orderNumber} Cancelled - Kapcdam Marketplace`,
        html: emailHtml,
      });

      if (result.error) {
        console.error("Failed to send order cancellation email:", result.error);
        return {
          success: false,
          error: result.error.message || "Failed to send email",
        };
      }

      console.log(
        "Order cancellation email sent successfully:",
        result.data?.id
      );
      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      console.error("Error sending order cancellation email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send order cancellation notification to admin
   */
  static async sendAdminCancellationNotification(
    orderData: OrderCancellationEmailData,
    userData: UserEmailData,
    adminEmail: string,
    cancellationReason?: string,
    notes?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not configured, skipping admin email");
        return {
          success: false,
          error: "Email service not configured",
        };
      }

      // Determine who cancelled the order
      const cancelledBy =
        orderData.orderStatus === "CANCELLED_BY_CUSTOMER"
          ? "CUSTOMER"
          : "ADMIN";

      const adminSubject = `Order #${orderData.orderNumber} Cancelled by ${cancelledBy} - Action Required`;

      // Render the admin email template
      const adminEmailHtml = await render(
        AdminOrderCancellationEmail({
          order: {
            ...orderData,
            cancellationReason,
            notes,
          },
          user: userData,
          cancelledBy,
        })
      );

      const result = await resend.emails.send({
        from: OrderEmailService.getFromAddress(),
        to: adminEmail,
        subject: adminSubject,
        html: adminEmailHtml,
      });

      if (result.error) {
        console.error("Failed to send admin notification:", result.error);
        return {
          success: false,
          error: result.error.message || "Failed to send admin email",
        };
      }

      console.log(
        "Admin cancellation notification sent successfully:",
        result.data?.id
      );
      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      console.error("Error sending admin notification:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send COD order confirmation to customer
   */
  static async sendOrderConfirmationCOD(
    orderData: Pick<
      import("./email-service").OrderCancellationEmailData,
      "orderNumber" | "orderItems" | "subtotal" | "total"
    >,
    userData: UserEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not configured, skipping email send");
        return { success: false, error: "Email service not configured" };
      }

      const emailHtml = await render(
        OrderConfirmationCODEmail({ order: orderData as any, user: userData })
      );

      const result = await resend.emails.send({
        from: OrderEmailService.getFromAddress(),
        to: userData.email,
        subject: `Order #${orderData.orderNumber} Received - Cash on Delivery`,
        html: emailHtml,
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send COD order notification to admin
   */
  static async sendAdminOrderConfirmationCOD(
    orderData: Pick<
      import("./email-service").OrderCancellationEmailData,
      "orderNumber" | "orderItems" | "subtotal" | "total"
    >,
    userData: UserEmailData,
    adminEmail: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not configured, skipping admin email");
        return { success: false, error: "Email service not configured" };
      }

      const emailHtml = await render(
        AdminOrderConfirmationCODEmail({ order: orderData as any, user: userData })
      );

      const result = await resend.emails.send({
        from: OrderEmailService.getFromAddress(),
        to: adminEmail,
        subject: `New COD Order #${orderData.orderNumber} - Kapcdam Marketplace`,
        html: emailHtml,
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
