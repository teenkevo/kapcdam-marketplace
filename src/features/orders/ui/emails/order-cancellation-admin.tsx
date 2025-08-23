import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
} from "@react-email/components";

interface Props {
  order: {
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
    cancellationReason?: string;
    notes?: string;
  };
  user: {
    firstName: string;
    email: string;
  };
  cancelledBy: "CUSTOMER" | "ADMIN";
}

const AdminOrderCancellationEmail = ({ order, user, cancelledBy }: Props) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Order #{order.orderNumber} has been cancelled - Action Required
      </Preview>
      <Tailwind>
        <Body className="bg-white font-sans py-4 px-2">
          <Container className="bg-white mx-auto rounded-[8px] max-w-[600px]">
            {/* Header */}
            <Section className="mb-[32px]">
              <Heading className="text-[24px] font-bold text-gray-900 m-0 mb-[16px]">
                Kapcdam Admin Panel
              </Heading>
              <Text className="text-[16px] text-red-600 m-0 font-semibold">
                Order #{order.orderNumber} has been cancelled
              </Text>
            </Section>

            {/* Customer Information */}
            <Section className="mb-[32px]">
              <Heading className="text-[18px] font-bold text-gray-900 m-0 mb-[16px]">
                Customer Details
              </Heading>
              <div className="bg-gray-50 p-[16px] rounded-[8px]">
                <Text className="text-[14px] text-gray-700 m-0 mb-[8px]">
                  <strong>Name:</strong> {user.firstName}
                </Text>
                <Text className="text-[14px] text-gray-700 m-0 mb-[8px]">
                  <strong>Email:</strong> {user.email}
                </Text>

                <Text className="text-[14px] text-gray-700 m-0 mb-[8px]">
                  <strong>Cancelled By:</strong> {cancelledBy}
                </Text>
                {order.cancellationReason && (
                  <Text className="text-[14px] text-gray-700 m-0 mb-[8px]">
                    <strong>Cancellation Reason:</strong>{" "}
                    {order.cancellationReason}
                  </Text>
                )}
                {order.notes && (
                  <Text className="text-[14px] text-gray-700 m-0">
                    <strong>Notes:</strong> {order.notes}
                  </Text>
                )}
              </div>
            </Section>

            {/* Payment & Refund Status */}
            <Section className="mb-[32px]">
              <div className="bg-blue-50 p-[16px] rounded-[8px] border border-blue-200">
                <Text className="text-[14px] text-gray-700 m-0 font-medium mb-[8px]">
                  Payment Status:{" "}
                  <span
                    className={
                      order.paymentStatus === "PAID"
                        ? "text-green-600"
                        : "text-orange-600"
                    }
                  >
                    {order.paymentStatus}
                  </span>
                </Text>
                {order.paymentStatus === "PAID" && (
                  <Text className="text-[14px] text-gray-700 m-0">
                    Refund processing required - Customer paid UGX {order.total}
                  </Text>
                )}
                {order.paymentStatus === "PENDING" && (
                  <Text className="text-[14px] text-gray-700 m-0">
                    No refund required - Payment was not completed
                  </Text>
                )}
              </div>
            </Section>

            {/* Footer */}
            <Hr className="my-[32px] border-gray-300" />
            <Section>
              <Text className="text-[12px] text-gray-500 m-0 mb-[8px]">
                Kapcdam Admin Notifications
              </Text>
              <Text className="text-[12px] text-gray-500 m-0 mb-[8px]">
                This email was sent to: {process.env.ADMIN_EMAIL}
              </Text>
              <Text className="text-[12px] text-gray-500 m-0">
                © {new Date().getFullYear()} Kapcdam Marketplace
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default AdminOrderCancellationEmail;
