import * as React from "react";
import {
  Body,
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
  };
  user: {
    firstName: string;
  };
}

const OrderCancellationEmail = ({ order, user }: Props) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Your Kapcdam order #{order.orderNumber} has been cancelled
      </Preview>
      <Tailwind>
        <Body className="bg-white font-sans py-4 px-2">
          <Container className="bg-white mx-auto   max-w-[600px]">
            {/* Header */}
            <Section className="mb-[32px]">
              <Heading className="text-[24px] font-bold text-gray-900 m-0 mb-[16px]">
                Kapcdam marketplace
              </Heading>
              <Text className="text-[16px] text-gray-600 m-0">
                Order Cancellation #{order.orderNumber}
              </Text>
            </Section>

            {/* Greeting */}
            <Section className="mb-[16px]">
              <Text className="text-[16px] text-gray-900 m-0">
                Dear {user.firstName},
              </Text>
            </Section>

            {/* Main Message */}
            <Section className="mb-[16px]">
              <Text className="text-[16px] text-gray-900 m-0 mb-[16px]">
                Your order with has been cancelled. Please retain this
                cancellation information for your records.
              </Text>
            </Section>

            {/* Cancellation Reversal Note */}
            <Section className="mb-[32px] bg-yellow-50 p-[16px] rounded-[8px] border border-yellow-200">
              {order.orderStatus === "CANCELLED_BY_CUSTOMER" ? (
                <Text className="text-[14px] text-gray-700 m-0">
                  If you have changed your mind or don't wish to cancel this
                  order please contact info@kapcdam.org
                </Text>
              ) : (
                <Text className="text-[14px] text-gray-700 m-0">
                  If you have not requested this cancellation, please contact
                  info@kapcdam.org
                </Text>
              )}
            </Section>

            {/* Order Summary */}
            <Section className="mb-[32px]">
              <Heading className="text-[20px] font-bold text-gray-900 m-0 mb-[16px]">
                Order Summary
              </Heading>

              <Text className="text-[14px] text-gray-600 m-0 mb-[16px]">
                Here are the details of what you ordered.
              </Text>

              {/* Order Table */}
              <div className="border border-gray-200 rounded-[8px] overflow-hidden">
                {/* Product Row */}
                <div className="p-[12px] border-b border-gray-200">
                  {order.orderItems.map((item) => (
                    <div
                      key={item.productName}
                      className="flex justify-between gap-2 items-start"
                    >
                      <Text className="text-[14px] text-gray-900 mr-2">
                        {item.quantity}
                      </Text>
                      <div className="flex-1">
                        <Text className="text-[14px] text-gray-900 m-0 font-medium">
                          {item.productName}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="bg-gray-50 p-[12px]">
                  <div className="flex justify-between items-center">
                    <Text className="text-[16px] font-bold text-gray-900 m-0">
                      Total:
                    </Text>
                    <Text className="text-[16px] font-bold text-gray-900 m-0">
                      UGX {order.total}
                    </Text>
                  </div>
                </div>
              </div>
            </Section>

            {/* Refund Information */}
            <Section className="mb-[32px] bg-blue-50 p-[16px] rounded-[8px] border border-blue-200">
              {order.paymentMethod === "PESAPAL" &&
                order.paymentStatus === "PAID" && (
                  <Text className="text-[14px] text-gray-700 m-0 font-medium">
                    Your order was paid so a refund has been made. It will be
                    reflected in your account in 3-5 business days.
                  </Text>
                )}
            </Section>

            {/* Closing */}
            <Section className="mb-[32px]">
              <Text className="text-[16px] text-gray-900 m-0 mb-[16px]">
                Kind regards,
                <br />
                Kapcdam team :-)
              </Text>
            </Section>

            {/* Footer */}
            <Hr className="my-[32px] border-gray-300" />
            <Section>
              <Text className="text-[12px] text-gray-500 m-0 mb-[8px]">
                Kapcdam marketplace
              </Text>
              <Text className="text-[12px] text-gray-500 m-0">
                info@kapcdam.org
              </Text>
              <Text className="text-[12px] text-gray-500 m-0">
                +256 7xx xxxx xxxx
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrderCancellationEmail;
