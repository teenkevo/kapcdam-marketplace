import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  baseProcedure,
  protectedProcedure,
} from "@/trpc/init";
import { z } from "zod";
import { client } from "@/sanity/lib/client";
import { trpc } from "@/trpc/server";
interface PesapalBillingAddress {
  email_address: string;
  phone_number: string;
  country_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  line_1: string;
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

interface PesapalOrderRequest {
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

const registerIpnSchema = z.object({
  url: z.string().url(),
  ipn_notification_type: z.enum(["GET", "POST"]),
});

// Validation schemas
const donorInfoSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^[+]?[0-9\s\-\(\)]{7,15}$/),
});

const createDonationSchema = z.object({
  amount: z.number().min(1),
  type: z.enum(["one_time", "monthly"]),
  donorInfo: donorInfoSchema,
  message: z.string().optional(),
  recurringDetails: z
    .object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime().optional(),
    })
    .optional(),
  isBankTransfer: z.boolean().default(false),
});

const updateDonationStatusSchema = z.object({
  donationId: z.string(),
  paymentStatus: z.enum(["not_initiated", "pending", "completed", "failed", "refunded"]),
  transactionId: z.string().optional(),
  orderTrackingId: z.string().optional(),
  confirmationCode: z.string().optional(),
  paidAt: z.string().datetime().optional(),
  paymentMethod: z.string().optional(),
  amount: z.number().optional(),
  isRecurring: z.boolean().default(false),
});

const processDonationPaymentSchema = z.object({
  donationId: z.string(),
});

// Lightweight donation meta for routing/decision
const donationMetaSchema = z.object({
  donationId: z.string(),
  paymentStatus: z.enum(["not_initiated", "pending", "completed", "failed", "refunded"]),
  orderTrackingId: z.string().nullable(),
  amount: z.number(),
  type: z.enum(["one_time", "monthly"]),
});

export type DonationMeta = z.infer<typeof donationMetaSchema>;

export function generateDonationId(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  return `DON-${year}-${timestamp.toString().slice(-6)}`;
}

export const donationsRouter = createTRPCRouter({
  create: baseProcedure
    .input(createDonationSchema)
    .mutation(async ({ input }) => {
      try {
        const donationId = generateDonationId();

        const donationData = {
          _type: "donation",
          donationId,
          amount: input.amount,
          currency: "USD",
          type: input.type,
          donorInfo: input.donorInfo,
          isBankTransfer: input.isBankTransfer,
          message: input.message,
          paymentStatus: input.isBankTransfer ? "pending" : "not_initiated",
          thankYouSent: false,
          donatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(input.type === "monthly" &&
            input.recurringDetails && {
              recurringDetails: {
                ...input.recurringDetails,
                frequency: "MONTHLY",
                isActive: true,
                totalDonations: 0,
                totalAmount: 0,
              },
            }),
        };

        const result = await client.create(donationData);
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create donation record",
        });
      }
    }),
  // Update donation status (for webhooks)
  updateStatus: baseProcedure
    .input(updateDonationStatusSchema)
    .mutation(async ({ input }) => {
      try {
        const donation = await client.fetch(
          `*[_type == "donation" && donationId == $donationId][0]`,
          { donationId: input.donationId }
        );

        if (!donation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Donation not found",
          });
        }

        const updateData: any = {
          paymentStatus: input.paymentStatus,
          updatedAt: new Date().toISOString(),
        };

        if (input.transactionId) updateData.transactionId = input.transactionId;
        if (input.orderTrackingId)
          updateData.orderTrackingId = input.orderTrackingId;
        if (input.confirmationCode)
          updateData.confirmationCode = input.confirmationCode;
        if (input.paidAt) updateData.paidAt = input.paidAt;

        // For completed payments
        if (input.paymentStatus === "completed") {
          if (input.paidAt) updateData.paidAt = input.paidAt;

          // Handle recurring payments vs initial payment
          if (input.isRecurring && donation.type === "monthly") {
            const currentRecurring = donation.recurringDetails || {};
            const currentPayments = currentRecurring.recurringPayments || [];

            // Add new payment to the array
            const newPayment = {
              paymentDate: input.paidAt || new Date().toISOString(),
              amount: input.amount || donation.amount,
              orderTrackingId: input.orderTrackingId,
              confirmationCode: input.confirmationCode,
              paymentStatus: "completed",
              paymentMethod: input.paymentMethod,
              isInitialPayment: false,
            };

            updateData.recurringDetails = {
              ...currentRecurring,
              totalDonations: (currentRecurring.totalDonations || 0) + 1,
              totalAmount:
                (currentRecurring.totalAmount || 0) +
                (input.amount || donation.amount),
              lastDonationDate: input.paidAt || new Date().toISOString(),
              nextDonationDate: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              recurringPayments: [...currentPayments, newPayment],
            };
          } else if (donation.type === "monthly") {
            // This is the initial payment for a monthly donation
            const currentRecurring = donation.recurringDetails || {};

            const initialPayment = {
              paymentDate: input.paidAt || new Date().toISOString(),
              amount: input.amount || donation.amount,
              orderTrackingId: input.orderTrackingId,
              confirmationCode: input.confirmationCode,
              paymentStatus: "completed",
              paymentMethod: input.paymentMethod,
              isInitialPayment: true,
            };

            updateData.recurringDetails = {
              ...currentRecurring,
              totalDonations: 1,
              totalAmount: input.amount || donation.amount,
              lastDonationDate: input.paidAt || new Date().toISOString(),
              nextDonationDate: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              recurringPayments: [initialPayment],
            };
          }
        }

        const result = await client
          .patch(donation._id)
          .set(updateData)
          .commit();

        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update donation status",
        });
      }
    }),

  // Handle recurring payment notification (called from webhook)
  handleRecurringPayment: baseProcedure
    .input(
      z.object({
        orderTrackingId: z.string(),
        originalDonationId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get transaction details from PESAPAL
        const transactionResponse = await fetch(
          `${process.env.PESAPAL_API_URL}/Transactions/GetTransactionStatus?orderTrackingId=${input.orderTrackingId}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${ctx.pesapalToken}`,
            },
          }
        );

        if (!transactionResponse.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to get transaction status",
          });
        }

        const transactionData = await transactionResponse.json();

        // Update the original donation with this recurring payment
        const donation = await client.fetch(
          `*[_type == "donation" && donationId == $donationId][0]`,
          { donationId: input.originalDonationId }
        );

        if (!donation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Original donation not found",
          });
        }

        // Update with recurring payment data
        const currentRecurring = donation.recurringDetails || {};
        const currentPayments = currentRecurring.recurringPayments || [];

        const newPayment = {
          paymentDate: new Date().toISOString(),
          amount: transactionData.amount,
          orderTrackingId: input.orderTrackingId,
          confirmationCode: transactionData.confirmation_code,
          paymentStatus:
            transactionData.payment_status_description === "Completed"
              ? "completed"
              : "failed",
          paymentMethod: transactionData.payment_method,
          isInitialPayment: false,
        };

        const result = await client
          .patch(donation._id)
          .set({
            recurringDetails: {
              ...currentRecurring,
              totalDonations: (currentRecurring.totalDonations || 0) + 1,
              totalAmount:
                (currentRecurring.totalAmount || 0) + transactionData.amount,
              lastDonationDate: new Date().toISOString(),
              nextDonationDate: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              recurringPayments: [...currentPayments, newPayment],
            },
            updatedAt: new Date().toISOString(),
          })
          .commit();

        return {
          success: true,
          transactionData,
          result,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to handle recurring payment",
        });
      }
    }),

  // Lightweight status fetcher for routing/decisions
  getDonationStatus: baseProcedure
    .input(z.object({ donationId: z.string() }))
    .query(async ({ input }) => {
      const meta = await client.fetch(
        `*[_type == "donation" && donationId == $donationId][0]{
          donationId,
          paymentStatus,
          orderTrackingId,
          amount,
          type
        }`,
        { donationId: input.donationId }
      );

      if (!meta) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Donation not found" });
      }

      return donationMetaSchema.parse(meta);
    }),

  // Process payment for existing donation
  processDonationPayment: baseProcedure
    .input(processDonationPaymentSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Fetch donation details
        const donation = await client.fetch(
          `*[_type == "donation" && donationId == $donationId][0]{
            _id,
            donationId,
            amount,
            type,
            paymentStatus,
            donorInfo,
            recurringDetails
          }`,
          { donationId: input.donationId }
        );

        if (!donation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Donation not found",
          });
        }

        if (donation.paymentStatus !== "not_initiated") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment processing not required for this donation",
          });
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL_PROD || process.env.NEXT_PUBLIC_BASE_URL;

        // Register IPN
        const registerIpn = await fetch(
          `${process.env.PESAPAL_API_URL}/URLSetup/RegisterIPN`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${ctx.pesapalToken}`,
            },
            body: JSON.stringify({
              ipn_notification_type: "POST",
              url: `${baseUrl}/api/webhooks/pesapal`,
            }),
          }
        );

        if (!registerIpn.ok) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to register IPN",
          });
        }

        const ipnResult = await registerIpn.json();

        const orderPayload: PesapalOrderRequest = {
          id: donation.donationId,
          amount: donation.amount,
          currency: "USD",
          description: `Donation to KAPCDAM - ${donation.type === "monthly" ? "Monthly" : "One-time"}`,
          callback_url: `${baseUrl}/api/donation/callback`,
          notification_id: ipnResult.ipn_id,
          billing_address: {
            email_address: donation.donorInfo.email,
            phone_number: donation.donorInfo.phone,
            country_code: "US",
            first_name: donation.donorInfo.firstName,
            last_name: donation.donorInfo.lastName,
            line_1: "Donation Address", // Required by Pesapal
            city: "Kampala",
          },
        };

        if (donation.type === "monthly" && donation.recurringDetails) {
          orderPayload.subscription_details = {
            start_date: new Date(donation.recurringDetails.startDate).toISOString().split('T')[0],
            end_date: donation.recurringDetails.endDate 
              ? new Date(donation.recurringDetails.endDate).toISOString().split('T')[0]
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            frequency: "MONTHLY",
          };
          orderPayload.account_number = donation.donationId;
        }

        // Submit order to Pesapal
        const paymentResponse = await fetch(
          `${process.env.PESAPAL_API_URL}/Transactions/SubmitOrderRequest`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ctx.pesapalToken}`,
            },
            body: JSON.stringify(orderPayload),
          }
        );

        if (!paymentResponse.ok) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to submit donation to payment processor",
          });
        }

        const paymentResult = await paymentResponse.json();

        // Update donation with tracking ID
        await client
          .patch(donation._id)
          .set({
            orderTrackingId: paymentResult.order_tracking_id,
            paymentStatus: "pending",
            updatedAt: new Date().toISOString(),
          })
          .commit();

        return {
          paymentUrl: paymentResult.redirect_url,
          orderTrackingId: paymentResult.order_tracking_id,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Donation payment processing error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process donation payment",
        });
      }
    }),
});
