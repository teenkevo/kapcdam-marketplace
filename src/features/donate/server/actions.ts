"use server";

import { PesapalOrderRequest } from "../../payments/schema";
import { formatDateToDDMMYYYY } from "../../payments/utils";
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

  // For card payments, redirect to status page for automatic handling
  if (paymentMethod === "card") {
    return {
      success: true,
      readyToRedirect: true,
      redirectUrl: `/donate/status/${donation.donationId}`,
    };
  } else {
    return {
      success: true,
      message: `Your reference number is: ${donation.donationId}. Please use this reference when making your bank transfer.`,
    };
  }
};
