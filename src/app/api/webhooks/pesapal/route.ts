import { NextRequest, NextResponse } from "next/server";
import { trpc } from "@/trpc/server";
import { z } from "zod";

// Simple in-memory rate limiting (for production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 50; // Max requests per window
const WINDOW_SIZE = 60 * 1000; // 1 minute in milliseconds

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(clientIP);
  
  // Cleanup expired entries (simple garbage collection)
  if (requestCounts.size > 1000) { // Prevent memory bloat
    for (const [ip, data] of requestCounts.entries()) {
      if (now > data.resetTime) {
        requestCounts.delete(ip);
      }
    }
  }
  
  if (!clientData || now > clientData.resetTime) {
    // First request or window has reset
    requestCounts.set(clientIP, { count: 1, resetTime: now + WINDOW_SIZE });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT) {
    return false; // Rate limit exceeded
  }
  
  // Increment counter
  clientData.count++;
  return true;
}

// Validation schemas for webhook data
const webhookBodySchema = z.object({
  OrderTrackingId: z.string().min(1),
  OrderNotificationType: z.string().min(1),
  OrderMerchantReference: z.string().min(1),
});

const webhookParamsSchema = z.object({
  OrderTrackingId: z.string().min(1),
  OrderNotificationType: z.string().min(1),  
  OrderMerchantReference: z.string().min(1),
});

// Basic webhook security validation
function validateWebhookSource(request: NextRequest): { isValid: boolean; reason?: string } {
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';

  // Rate limiting check
  if (!checkRateLimit(clientIP)) {
    console.warn(`Webhook rate limit exceeded for IP: ${clientIP}`);
    return { isValid: false, reason: 'Rate limit exceeded' };
  }

  // Check User-Agent (Pesapal should have a specific user agent)
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || !userAgent.toLowerCase().includes('pesapal')) {
    console.warn('Webhook rejected: Invalid or missing User-Agent');
    return { isValid: false, reason: 'Invalid User-Agent' };
  }

  // Check Content-Type for POST requests
  const contentType = request.headers.get('content-type');
  if (request.method === 'POST' && (!contentType || !contentType.includes('application/json'))) {
    console.warn('Webhook rejected: Invalid Content-Type');
    return { isValid: false, reason: 'Invalid Content-Type' };
  }
  
  // Log the webhook attempt for monitoring
  console.log(`Pesapal webhook accepted from IP: ${clientIP}, Method: ${request.method}, UA: ${userAgent}`);
  
  return { isValid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Basic security validation
    const validationResult = validateWebhookSource(request);
    if (!validationResult.isValid) {
      const status = validationResult.reason === 'Rate limit exceeded' ? 429 : 401;
      return NextResponse.json(
        { error: validationResult.reason || "Unauthorized webhook source" }, 
        { status }
      );
    }

    const body = await request.json();

    // Validate webhook data structure
    const bodyValidation = webhookBodySchema.safeParse(body);
    if (!bodyValidation.success) {
      console.warn('Webhook validation failed:', bodyValidation.error);
      return NextResponse.json(
        { error: "Invalid webhook data structure" },
        { status: 400 }
      );
    }

    const { OrderTrackingId, OrderNotificationType, OrderMerchantReference } = bodyValidation.data;

    // Handle recurring donations
    if (OrderNotificationType === "RECURRING") {
      const result = await trpc.donations.handleRecurringPayment({
        orderTrackingId: OrderTrackingId,
        originalDonationId: OrderMerchantReference, 
      });
      return NextResponse.json(result);
    }

    // Check if it's a donation (donation IDs start with "DON-")
    if (OrderMerchantReference.startsWith("DON-")) {
      // Handle initial donation payment
      const transactionStatus = await trpc.payments.getTransactionStatus({
        order_tracking_id: OrderTrackingId,
      });

      const isPaymentCompleted = transactionStatus.payment_status_description === "Completed";
      
      const result = await trpc.donations.updateStatus({
        donationId: OrderMerchantReference,
        paymentStatus: isPaymentCompleted ? "completed" : "failed",
        orderTrackingId: OrderTrackingId,
        confirmationCode: transactionStatus.confirmation_code,
        paidAt: new Date().toISOString(),
        paymentMethod: transactionStatus.payment_method,
        amount: transactionStatus.amount,
        isRecurring: false, 
      });

      // If payment failed and it's a one-time donation, delete it (cleanup)
      if (!isPaymentCompleted) {
        try {
          const { client } = await import("@/sanity/lib/client");
          const donation = await client.fetch(
            `*[_type == "donation" && donationId == $donationId][0]{_id, type}`,
            { donationId: OrderMerchantReference }
          );

          if (donation && donation.type === "one_time") {
            await client.delete(donation._id);
            console.log(`Deleted failed one-time donation: ${OrderMerchantReference}`);
          }
        } catch (error) {
          console.error("Failed to delete failed donation:", error);
          // Don't fail the webhook if deletion fails
        }
      }

      return NextResponse.json({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 200,
      });
    }

    // Handle order payments - check if merchantReference is an order ID
    if (OrderMerchantReference && !OrderMerchantReference.startsWith("DON-")) {
      console.log("Processing order payment webhook for:", OrderMerchantReference);
      
      // Get transaction status
      const transactionStatus = await trpc.payments.getTransactionStatus({
        order_tracking_id: OrderTrackingId,
      });

      // Update order payment status
      await trpc.orders.updatePaymentStatus({
        orderId: OrderMerchantReference,
        paymentStatus:
          transactionStatus.payment_status_description === "Completed"
            ? "paid"
            : "failed",
        transactionId: OrderTrackingId,
        paidAt: transactionStatus.payment_status_description === "Completed" 
          ? new Date().toISOString() 
          : undefined,
      });

      return NextResponse.json({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 200,
      });
    }

    // Handle regular product payments (existing logic - kept for backwards compatibility)
    const result = await trpc.payments.handleIpnNotification({
      OrderTrackingId,
      OrderNotificationType,
      OrderMerchantReference,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Pesapal webhook POST error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  try {
    // Basic security validation
    const validationResult = validateWebhookSource(request);
    if (!validationResult.isValid) {
      const status = validationResult.reason === 'Rate limit exceeded' ? 429 : 401;
      return NextResponse.json(
        { error: validationResult.reason || "Unauthorized webhook source" }, 
        { status }
      );
    }

    // Extract and validate URL parameters
    const rawParams = {
      OrderTrackingId: searchParams.get("OrderTrackingId"),
      OrderNotificationType: searchParams.get("OrderNotificationType"),
      OrderMerchantReference: searchParams.get("OrderMerchantReference"),
    };

    const paramsValidation = webhookParamsSchema.safeParse(rawParams);
    if (!paramsValidation.success) {
      console.warn('Webhook GET validation failed:', paramsValidation.error);
      return NextResponse.json(
        { error: "Invalid webhook parameters" },
        { status: 400 }
      );
    }

    const { OrderTrackingId, OrderNotificationType, OrderMerchantReference } = paramsValidation.data;

    // Same logic as POST but with URL params
    if (OrderNotificationType === "RECURRING") {
      const result = await trpc.donations.handleRecurringPayment({
        orderTrackingId: OrderTrackingId,
        originalDonationId: OrderMerchantReference,
      });
      return NextResponse.json(result);
    }

    if (OrderMerchantReference.startsWith("DON-")) {
      const transactionStatus = await trpc.payments.getTransactionStatus({
        order_tracking_id: OrderTrackingId,
      });

      const isPaymentCompleted = transactionStatus.payment_status_description === "Completed";

      const result = await trpc.donations.updateStatus({
        donationId: OrderMerchantReference,
        paymentStatus: isPaymentCompleted ? "completed" : "failed",
        orderTrackingId: OrderTrackingId,
        confirmationCode: transactionStatus.confirmation_code,
        paidAt: new Date().toISOString(),
        paymentMethod: transactionStatus.payment_method,
        amount: transactionStatus.amount,
        isRecurring: false,
      });

      // If payment failed and it's a one-time donation, delete it (cleanup)
      if (!isPaymentCompleted) {
        try {
          const { client } = await import("@/sanity/lib/client");
          const donation = await client.fetch(
            `*[_type == "donation" && donationId == $donationId][0]{_id, type}`,
            { donationId: OrderMerchantReference }
          );

          if (donation && donation.type === "one_time") {
            await client.delete(donation._id);
            console.log(`Deleted failed one-time donation: ${OrderMerchantReference}`);
          }
        } catch (error) {
          console.error("Failed to delete failed donation:", error);
          // Don't fail the webhook if deletion fails
        }
      }

      return NextResponse.json({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 200,
      });
    }

    // Handle order payments - check if merchantReference is an order ID
    if (OrderMerchantReference && !OrderMerchantReference.startsWith("DON-")) {
      console.log("Processing order payment webhook (GET) for:", OrderMerchantReference);
      
      // Get transaction status
      const transactionStatus = await trpc.payments.getTransactionStatus({
        order_tracking_id: OrderTrackingId,
      });

      // Update order payment status
      await trpc.orders.updatePaymentStatus({
        orderId: OrderMerchantReference,
        paymentStatus:
          transactionStatus.payment_status_description === "Completed"
            ? "paid"
            : "failed",
        transactionId: OrderTrackingId,
        paidAt: transactionStatus.payment_status_description === "Completed" 
          ? new Date().toISOString() 
          : undefined,
      });

      return NextResponse.json({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 200,
      });
    }

    const result = await trpc.payments.handleIpnNotification({
      OrderTrackingId,
      OrderNotificationType,
      OrderMerchantReference,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Pesapal webhook GET error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
