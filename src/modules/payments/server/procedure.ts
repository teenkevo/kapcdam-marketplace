import { TRPCError } from "@trpc/server";
import { createTRPCRouter, baseProcedure, protectedProcedure } from "@/trpc/init";
import { z } from "zod";

const billingAddressSchema = z.object({
  email_address: z.string().email(),
  phone_number: z.string(),
  country_code: z.string().length(2),
  first_name: z.string(),
  last_name: z.string(),
  line_1: z.string(),
  city: z.string().optional(),
});

const submitOrderSchema = z.object({
  id: z.string(),
  currency: z.string(),
  amount: z.number().positive(),
  description: z.string(),
  callback_url: z.string().url(),
  notification_id: z.string().uuid(),
  billing_address: billingAddressSchema,
});

const registerIpnSchema = z.object({
  url: z.string().url(),
  ipn_notification_type: z.enum(["GET", "POST"]),
});

const refundRequestSchema = z.object({
  confirmation_code: z.string(),
  amount: z.number().positive(),
  username: z.string(),
  remarks: z.string(),
});

const cancelOrderSchema = z.object({
  order_tracking_id: z.string().uuid(),
});

const getTransactionStatusSchema = z.object({
  order_tracking_id: z.string().uuid(),
});

export const paymentsRouter = createTRPCRouter({
  // Register IPN URL
  registerIpn: protectedProcedure
    .input(registerIpnSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // console.log("token: ", ctx.pesapalToken);
        const response = await fetch(
          `${process.env.PESAPAL_API_URL}/URLSetup/RegisterIPN`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${ctx.pesapalToken}`, 
            },
            body: JSON.stringify(input),
          }
        );

        console.log(response)

        if (!response.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to register IPN URL",
          });
        }

        const result = await response.json();
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server error",
        });
      }
    }),

  // Submit order request 
  submitOrder: protectedProcedure
    .input(submitOrderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const response = await fetch(
          `${process.env.PESAPAL_API_URL}/Transactions/SubmitOrderRequest`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ctx.pesapalToken}`,
            },
            body: JSON.stringify(input),
          }
        );

        if (!response.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to submit order",
          });
        }

        const result = await response.json();
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error submitting order",
        });
      }
    }),

  // Get transaction status
  getTransactionStatus: baseProcedure
    .input(getTransactionStatusSchema)
    .query(async ({ input, ctx }) => {
      try {
        const response = await fetch(
          `${process.env.PESAPAL_API_URL}/Transactions/GetTransactionStatus?orderTrackingId=${input.order_tracking_id}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${ctx.pesapalToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to get transaction status",
          });
        }

        const result = await response.json();
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error getting transaction status",
        });
      }
    }),

  // Process refund
  processRefund: protectedProcedure
    .input(refundRequestSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const response = await fetch(
          `${process.env.PESAPAL_API_URL}/Transactions/RefundRequest`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ctx.pesapalToken}`,
            },
            body: JSON.stringify(input),
          }
        );

        if (!response.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to process refund",
          });
        }

        const result = await response.json();
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error processing refund",
        });
      }
    }),

  // Cancel order
  cancelOrder: protectedProcedure
    .input(cancelOrderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const response = await fetch(
          `${process.env.PESAPAL_API_URL}/Transactions/CancelOrder`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ctx.pesapalToken}`,
            },
            body: JSON.stringify(input),
          }
        );

        if (!response.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to cancel order",
          });
        }

        const result = await response.json();
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error cancelling order",
        });
      }
    }),

  handleIpnNotification: baseProcedure
    .input(
      z.object({
        OrderTrackingId: z.string().uuid(),
        OrderNotificationType: z.string(),
        OrderMerchantReference: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get full transaction details
        const transactionStatus = await fetch(
          `${process.env.PESAPAL_API_URL}/Transactions/GetTransactionStatus?orderTrackingId=${input.OrderTrackingId}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${ctx.pesapalToken}`,
            },
          }
        );

        if (!transactionStatus.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to get transaction status for IPN",
          });
        }

        const transactionData = await transactionStatus.json();

        // TODO: Process the payment based on transactionData and update Sanity
        // Update your database, send confirmations, etc.
        // Return the required response format for PESAPAL
        return {
          orderNotificationType: input.OrderNotificationType,
          orderTrackingId: input.OrderTrackingId,
          orderMerchantReference: input.OrderMerchantReference,
          status: 200,
        };
      } catch (error) {
        // Return error status to PESAPAL
        return {
          orderNotificationType: input.OrderNotificationType,
          orderTrackingId: input.OrderTrackingId,
          orderMerchantReference: input.OrderMerchantReference,
          status: 500,
        };
      }
    }),
});
