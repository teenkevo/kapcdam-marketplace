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

const processDonationPaymentSchema = z.object({
  donationId: z.string(),
  notification_id:z.string().url(),
});

const updateDonationStatusSchema = z.object({
  donationId: z.string(),
  paymentStatus: z.enum(["pending", "completed", "failed", "refunded"]),
  transactionId: z.string().optional(),
  orderTrackingId: z.string().optional(),
  confirmationCode: z.string().optional(),
  paidAt: z.string().datetime().optional(),
  paymentMethod: z.string().optional(),
  amount: z.number().optional(),
  isRecurring: z.boolean().default(false),
});

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
          paymentStatus: "pending",
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

  // registerIpn: baseProcedure
  //   .input(registerIpnSchema)
  //   .mutation(async ({ input, ctx }) => {
  //     try {
  //       // console.log("token: ", ctx.pesapalToken);
  //       const response = await fetch(
  //         `${process.env.PESAPAL_API_URL}/URLSetup/RegisterIPN`,
  //         {
  //           method: "POST",
  //           headers: {
  //             Accept: "application/json",
  //             "Content-Type": "application/json",
  //             Authorization: `Bearer ${ctx.pesapalToken}`,
  //           },
  //           body: JSON.stringify(input),
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new TRPCError({
  //           code: "BAD_REQUEST",
  //           message: "Failed to register IPN URL",
  //         });
  //       }

  //       const result = await response.json();
  //       return result;
  //     } catch (error) {
  //       throw new TRPCError({
  //         code: "INTERNAL_SERVER_ERROR",
  //         message: "Server error",
  //       });
  //     }
  //   }),
//   processPayment: baseProcedure
//     .input(processDonationPaymentSchema)
//     .mutation(async ({ input, ctx }) => {

//       console.log("----- Processing payment -----")
//       try {
//         // Fetch donation details
//         const donation = await client.fetch(
//           `*[_type == "donation" && donationId == $donationId][0]`,
//           { donationId: input.donationId }
//         );

//         if (!donation) {
//           throw new TRPCError({
//             code: "NOT_FOUND",
//             message: "Donation not found",
//           });
//         }

//           const baseUrl = process.env.NEXT_PUBLIC_BASE_URL_PROD;

//              console.log("Donation", donation);
//              console.log("Base Url: ", `${baseUrl}/api/donation/callback`);

//          const orderPayload: PesapalOrderRequest = {
//            id: donation.donationId,
//            currency: "USD",
//            amount: donation.amount,
//            description: `Donation to KAPCDAM - ${donation.type === "monthly" ? "Monthly" : "One-time"}`,
//            callback_url: `${baseUrl}/api/donation/callback`,
//            notification_id: input.notification_id,
//            billing_address: {
//              email_address: donation.donorInfo.email,
//              phone_number: donation.donorInfo.phone,
//              country_code: "UG",
//              first_name: donation.donorInfo.firstName,
//              last_name: donation.donorInfo.lastName,
//              line_1: "KAPCDAM Donation",
//            },
//          };

    

//         if (donation.type === "monthly" && donation.recurringDetails) {
        
//           orderPayload.account_number = donation.donationId;

//           if (donation.recurringDetails.startDate) {
//             orderPayload.subscription_details = {
//               start_date: formatDateForPesapal(
//                 donation.recurringDetails.startDate
//               ),
//               end_date: donation.recurringDetails.endDate
//                 ? formatDateForPesapal(donation.recurringDetails.endDate)
//                 : formatDateForPesapal(
//                     new Date(
//                       Date.now() + 365 * 24 * 60 * 60 * 1000
//                     ).toISOString()
//                   ),
//               frequency: "MONTHLY",
//             };
//           }
//         }

// console.log("Input", input);
        
//         const response = await fetch(
//           `${process.env.PESAPAL_API_URL}/Transactions/SubmitOrderRequest`,
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${ctx.pesapalToken}`,
//             },
//             body: JSON.stringify(orderPayload),
//           }
//         );

//         console.log("Order Response",response)

//         if (!response.ok) {
//           throw new TRPCError({
//             code: "BAD_REQUEST",
//             message: "Failed to submit order",
//           });
//         }

//         const orderResponse = await response.json();

//         if (orderResponse.order_tracking_id) {
//           await client
//             .patch(donation._id)
//             .set({
//               orderTrackingId: orderResponse.order_tracking_id,
//               updatedAt: new Date().toISOString(),
//             })
//             .commit();
//         }

//         return orderResponse;
//       } catch (error) {
//         throw new TRPCError({
//           code: "INTERNAL_SERVER_ERROR",
//           message: "Failed to process donation payment",
//         });
//       }
//     }),

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
});
