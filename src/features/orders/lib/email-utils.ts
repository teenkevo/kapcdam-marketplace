import {
  OrderEmailService,
  OrderCancellationEmailData,
  UserEmailData,
} from "./email-service";

/**
 * Transform order data from database format to email template format
 */
export function transformOrderForEmail(order: any): OrderCancellationEmailData {
  const paymentMethodMap: Record<string, "COD" | "PESAPAL"> = {
    cod: "COD",
    pesapal: "PESAPAL",
  };

  const paymentStatusMap: Record<
    string,
    "NOT_INITIATED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED"
  > = {
    not_initiated: "NOT_INITIATED",
    pending: "PENDING",
    paid: "PAID",
    failed: "FAILED",
    refunded: "REFUNDED",
  };

  const orderStatusMap: Record<
    string,
    "CANCELLED_BY_CUSTOMER" | "CANCELLED_BY_ADMIN"
  > = {
    CANCELLED_BY_USER: "CANCELLED_BY_CUSTOMER",
    CANCELLED_BY_ADMIN: "CANCELLED_BY_ADMIN",
  };

  const orderItems =
    order.orderItems?.map((item: any) => {
      let productName = "Unknown Product";
      let productPrice = 0;

      if (item.name && item.unitPrice) {
        productName = item.name;
        productPrice = item.unitPrice;
      } else if (item.product?.name || item.course?.title) {
        productName =
          item.product?.name || item.course?.title || "Unknown Product";
        productPrice = item.product?.price || item.course?.price || 0;
        console.log("Using referenced data:", { productName, productPrice });
      } else {
        console.log("No data available for item:", item);
      }

      return {
        productName,
        quantity: item.quantity || 1,
        productPrice,
      };
    }) || [];

  // Calculate totals
  const subtotal = orderItems.reduce(
    (sum: number, item: any) => sum + item.productPrice * item.quantity,
    0
  );
  const total = order.total || subtotal;

  return {
    orderNumber: order.orderNumber || "Unknown",
    orderStatus: orderStatusMap[order.status] || "CANCELLED_BY_CUSTOMER",
    paymentMethod: paymentMethodMap[order.paymentMethod] || "COD",
    paymentStatus: paymentStatusMap[order.paymentStatus] || "NOT_INITIATED",
    orderItems,
    subtotal,
    total,
  };
}

/**
 * Transform user data for email
 */
export function transformUserForEmail(user: any): UserEmailData {
  return {
    firstName: user.firstName || user.name?.split(" ")[0] || "Customer",
    email: user.email || "",
  };
}

/**
 * Send order cancellation email with proper error handling
 */
export async function sendOrderCancellationEmail(
  order: any,
  user: any,
  adminEmail?: string,
  cancellationReason?: string,
  notes?: string
): Promise<{
  success: boolean;
  customerEmailSent: boolean;
  adminEmailSent: boolean;
}> {
  try {
    // Transform data for email
    const orderEmailData = transformOrderForEmail(order);
    const userEmailData = transformUserForEmail(user);

    // Send customer email
    const customerEmailResult =
      await OrderEmailService.sendOrderCancellationEmail(
        orderEmailData,
        userEmailData
      );

    // Send admin notification if admin email is provided
    let adminEmailResult = { success: false };
    if (adminEmail) {
      adminEmailResult =
        await OrderEmailService.sendAdminCancellationNotification(
          orderEmailData,
          userEmailData,
          adminEmail,
          cancellationReason,
          notes
        );
    }

    return {
      success: customerEmailResult.success || adminEmailResult.success,
      customerEmailSent: customerEmailResult.success,
      adminEmailSent: adminEmailResult.success,
    };
  } catch (error) {
    console.error("Error in sendOrderCancellationEmail:", error);
    return {
      success: false,
      customerEmailSent: false,
      adminEmailSent: false,
    };
  }
}
