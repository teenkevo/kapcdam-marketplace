import { redirect } from "next/navigation";
import DonationRedirectView from "@/features/donate/ui/views/donation-redirect-view";
import DonationPendingOrFailedView from "@/features/donate/ui/views/donation-pending-or-failed-view";
import DonationSuccessView from "@/features/donate/ui/views/donation-success-view";
import { trpc } from "@/trpc/server";
import { DonationStateManager } from "./donation-state-manager";

interface Props {
  params: Promise<{ donationId: string }>;
}

export default async function DonationStatusPage({ params }: Props) {
  const { donationId } = await params;

  if (!donationId) {
    redirect("/donate");
  }

  const meta = await trpc.donations.getDonationStatus({ donationId });

  let viewComponent: React.ReactNode;
  let viewType: 'payment-redirect' | 'pending-failed' | 'success';
  let mode: 'pending' | 'failed' | undefined;

  if (
    meta.paymentStatus === "not_initiated" &&
    !meta.orderTrackingId
  ) {
    // Show redirect view while DonationStateManager handles the actual redirect
    viewComponent = <DonationRedirectView donationId={donationId} />;
    viewType = "payment-redirect";
  } else if (
    (meta.paymentStatus === "pending" || meta.paymentStatus === "failed") &&
    meta.orderTrackingId
  ) {
    viewComponent = <DonationPendingOrFailedView donationId={donationId} mode={meta.paymentStatus} />;
    viewType = "pending-failed";
    mode = meta.paymentStatus;
  } else if (meta.paymentStatus === "completed") {
    viewComponent = <DonationSuccessView donationId={donationId} />;
    viewType = "success";
  } else {
    viewComponent = <DonationPendingOrFailedView donationId={donationId} />;
    viewType = "pending-failed";
  }

  return (
    <>
      <DonationStateManager 
        donationId={donationId}
        paymentStatus={meta.paymentStatus}
        orderTrackingId={meta.orderTrackingId}
        amount={meta.amount}
        type={meta.type}
        view={viewType}
        mode={mode}
      />
      {viewComponent}
    </>
  );
}