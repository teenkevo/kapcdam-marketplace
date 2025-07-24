"use server";

import { PesapalOrderRequest } from "../payments/schema";
import { formatDateToDDMMYYYY } from "../payments/utils";
import { trpc } from "@/trpc/server";

type DonationPayload = {
  donationAmount: number;
  donationType: "monthly" | "one-time";
  paymentMethod: "bank" | "card";
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
};

export const makeDonation = async (donationPayload: DonationPayload) => {
  const { donationAmount, donationType, paymentMethod, data } = donationPayload;

  const donation = await trpc.donations.create({
    amount: donationAmount,
    type: donationType === "monthly" ? "monthly" : "one_time",
    isBankTransfer: paymentMethod === "bank" ? true : false,
    donorInfo: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    },
    ...(donationType === "monthly" && {
      recurringDetails: {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Default to 1 year
      },
    }),
  });

  // Process payment if using card method
  if (paymentMethod === "card") {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL_PROD;

    const registerIpn = await trpc.payments.registerIpn({
      ipn_notification_type: "POST",
      url: `${baseUrl}/api/webhooks/pesapal`,
    });

    const orderPayload: PesapalOrderRequest = {
      id: donation.donationId,
      amount: donationAmount,
      currency: "USD",
      description: `Donation to KAPCDAM - ${donationType === "monthly" ? "Monthly" : "One-time"}`,
      callback_url: `${baseUrl}/api/payment/callback`,
      notification_id: registerIpn.ipn_id,
      billing_address: {
        email_address: donation.donorInfo.email,
        phone_number: donation.donorInfo.phone,
        first_name: donation.donorInfo.firstName,
        last_name: donation.donorInfo.lastName,
      },
    };

    if (donationType === "monthly") {
      orderPayload.subscription_details = {
        start_date: formatDateToDDMMYYYY(
          donation.recurringDetails?.startDate as string
        ),
        end_date: formatDateToDDMMYYYY(
          donation.recurringDetails?.endDate as string
        ),
        frequency: "MONTHLY",
      };
      orderPayload.account_number = donation.donationId;
    }

    console.log("Order Payload", orderPayload);

    const paymentResult = await trpc.payments.submitOrder(orderPayload);

    // Redirect to Pesapal payment page
    if (paymentResult.redirect_url) {
      return {
        success: true,
        readyToRedirect: true,
        redirectUrl: paymentResult.redirect_url,
      };
    } else {
      throw new Error("Payment redirect URL not received");
    }
  } else {
    return {
      success: true,
      message: `Your reference number is: ${donation.donationId}. Please use this reference when making your bank transfer.`,
    };
  }
};
