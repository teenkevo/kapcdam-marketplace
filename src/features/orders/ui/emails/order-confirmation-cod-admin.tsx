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
    email: string;
  };
}

const AdminOrderConfirmationCODEmail = ({ order, user }: Props) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        New COD Order #{order.orderNumber} placed
      </Preview>
      <Tailwind>
        <Body className="bg-white font-sans py-4 px-2">
          <Container className="bg-white mx-auto rounded-[8px] max-w-[600px]">
            {/* Header */}
            <Section className="mb-[32px]">
              <Heading className="text-[24px] font-bold text-gray-900 m-0 mb-[16px]">
                Kapcdam Admin Panel
              </Heading>
              <Text className="text-[16px] text-green-700 m-0 font-semibold">
                New COD order #{order.orderNumber} placed
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
                <Text className="text-[14px] text-gray-700 m-0">
                  <strong>Payment Method:</strong> Cash on Delivery
                </Text>
              </div>
            </Section>

            {/* Order Summary */}
            <Section className="mb-[32px]">
              <Heading className="text-[18px] font-bold text-gray-900 m-0 mb-[16px]">
                Order Summary
              </Heading>
              <div className="border border-gray-200 rounded-[8px] overflow-hidden">
                {/* Product Rows */}
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
                      Total to Collect:
                    </Text>
                    <Text className="text-[16px] font-bold text-gray-900 m-0">
                      UGX {order.total}
                    </Text>
                  </div>
                </div>
              </div>
            </Section>

            {/* Footer */}
            <Hr className="my-[32px] border-gray-300" />
            <Section>
              <Text className="text-[12px] text-gray-500 m-0 mb-[8px]">
                Kapcdam Admin Notifications
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

export default AdminOrderConfirmationCODEmail;
