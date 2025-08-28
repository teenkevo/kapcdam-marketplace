import { TRPCError } from "@trpc/server";
import { createTRPCRouter, baseProcedure, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { cancelOrderSchema, getTransactionStatusSchema, refundRequestSchema, registerIpnSchema, submitOrderSchema, type PesapalOrderRequest } from "../schema";



export const paymentsRouter = createTRPCRouter({
  // Register IPN URL
  registerIpn: baseProcedure
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
  submitOrder: baseProcedure
    .input(submitOrderSchema)
    .mutation(async ({ input, ctx }) => {
      try {

        console.log("Server Payload", input);
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
        // Check if demo mode is enabled
        const isDemoMode = process.env.DEMO_PAYMENTS_ENABLED === "true";
        
        if (isDemoMode) {
          console.log("🎭 DEMO MODE: Getting transaction status", { orderTrackingId: input.order_tracking_id });
          
          // Use our demo payment API instead of real Pesapal
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL_PROD || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
          const response = await fetch(
            `${baseUrl}/api/demo-payments?orderTrackingId=${input.order_tracking_id}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
            }
          );

          if (!response.ok) {
            console.error("🎭 DEMO MODE: Failed to get transaction status");
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Failed to get demo transaction status",
            });
          }

          const result = await response.json();
          console.log("🎭 DEMO MODE: Transaction status result", result);
          return result;
        }

        // Original Pesapal API call for production
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
