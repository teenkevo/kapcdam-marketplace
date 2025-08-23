// Demo payment utilities and helpers

export interface DemoPaymentResponse {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code: string;
  payment_status_description: "COMPLETED" | "FAILED" | "INVALID" | "REVERSED";
  description: string;
  message: "Request processed successfully";
  payment_account: string;
  call_back_url: string;
  status_code: 0 | 1 | 2 | 3;
  merchant_reference: string;
  currency: "UGX";
  status: "200";
}

export interface DemoSettings {
  defaultOutcome: "success" | "failure" | "random";
  successRate: number;
  simulateDelay: boolean;
  maxDelay: number;
}

export const DEFAULT_DEMO_SETTINGS: DemoSettings = {
  defaultOutcome: "random",
  successRate: 0.7,
  simulateDelay: true,
  maxDelay: 2000,
};

// Pesapal status code mappings
export const PESAPAL_STATUS_CODES = {
  INVALID: 0,
  COMPLETED: 1,
  FAILED: 2,
  REVERSED: 3,
} as const;

export const PESAPAL_STATUS_DESCRIPTIONS = {
  0: "INVALID",
  1: "COMPLETED", 
  2: "FAILED",
  3: "REVERSED",
} as const;

// Generate realistic payment methods for Uganda
export const UGANDA_PAYMENT_METHODS = [
  "MTN Mobile Money",
  "Airtel Money",
  "Visa",
  "Mastercard",
  "Chipper Cash",
  "Absa Bank",
  "Stanbic Bank",
] as const;

// Generate realistic failure reasons
export const PAYMENT_FAILURE_REASONS = [
  "Insufficient funds",
  "Invalid PIN",
  "Transaction timeout", 
  "Card declined by issuer",
  "Network connectivity error",
  "Daily transaction limit exceeded",
  "Unable to Authorize Transaction. Kindly contact your bank for assistance",
  "Transaction cancelled by user",
  "Invalid phone number format",
  "Service temporarily unavailable",
] as const;

/**
 * Generate a realistic payment account number based on payment method
 */
export function generatePaymentAccount(paymentMethod: string): string {
  if (paymentMethod.includes("Mobile Money") || paymentMethod.includes("Airtel") || paymentMethod.includes("Chipper")) {
    // Mobile money accounts are phone numbers
    return `+256***${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }
  
  if (paymentMethod.includes("Visa")) {
    return `4***${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  }
  
  if (paymentMethod.includes("Mastercard")) {
    return `5***${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  }
  
  // Bank accounts
  return `****${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
}

/**
 * Generate a realistic confirmation code
 */
export function generateConfirmationCode(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

/**
 * Generate a demo transaction response
 */
export function generateDemoTransaction(
  orderTrackingId: string,
  merchantReference: string,
  amount: number,
  forceOutcome?: "success" | "failure",
  settings: DemoSettings = DEFAULT_DEMO_SETTINGS
): DemoPaymentResponse {
  const now = new Date().toISOString();
  const confirmationCode = generateConfirmationCode();
  
  // Determine outcome
  let outcome: "success" | "failure";
  if (forceOutcome) {
    outcome = forceOutcome;
  } else if (settings.defaultOutcome === "random") {
    outcome = Math.random() < settings.successRate ? "success" : "failure";
  } else {
    outcome = settings.defaultOutcome === "success" ? "success" : "failure";
  }

  // Random payment method
  const paymentMethod = UGANDA_PAYMENT_METHODS[Math.floor(Math.random() * UGANDA_PAYMENT_METHODS.length)];
  const paymentAccount = generatePaymentAccount(paymentMethod);

  if (outcome === "success") {
    return {
      payment_method: paymentMethod,
      amount,
      created_date: now,
      confirmation_code: confirmationCode,
      payment_status_description: "COMPLETED",
      description: "Payment completed successfully",
      message: "Request processed successfully",
      payment_account: paymentAccount,
      call_back_url: `http://localhost:3000/api/payment/orders/callback/${orderTrackingId}`,
      status_code: PESAPAL_STATUS_CODES.COMPLETED,
      merchant_reference: merchantReference,
      currency: "UGX",
      status: "200",
    };
  } else {
    const failureReason = PAYMENT_FAILURE_REASONS[Math.floor(Math.random() * PAYMENT_FAILURE_REASONS.length)];
    
    return {
      payment_method: paymentMethod,
      amount,
      created_date: now,
      confirmation_code: confirmationCode,
      payment_status_description: "FAILED",
      description: failureReason,
      message: "Request processed successfully",
      payment_account: paymentAccount,
      call_back_url: `http://localhost:3000/api/payment/orders/callback/${orderTrackingId}`,
      status_code: PESAPAL_STATUS_CODES.FAILED,
      merchant_reference: merchantReference,
      currency: "UGX",
      status: "200",
    };
  }
}

/**
 * Generate an invalid transaction response
 */
export function generateInvalidTransaction(): DemoPaymentResponse {
  return {
    payment_method: "",
    amount: 0,
    created_date: new Date().toISOString(),
    confirmation_code: "",
    payment_status_description: "INVALID",
    description: "Invalid transaction ID or transaction not found",
    message: "Request processed successfully",
    payment_account: "",
    call_back_url: "",
    status_code: PESAPAL_STATUS_CODES.INVALID,
    merchant_reference: "",
    currency: "UGX",
    status: "200",
  };
}

/**
 * Generate a reversed transaction response
 */
export function generateReversedTransaction(originalTransaction: DemoPaymentResponse): DemoPaymentResponse {
  return {
    ...originalTransaction,
    payment_status_description: "REVERSED",
    description: "Transaction has been reversed/refunded",
    status_code: PESAPAL_STATUS_CODES.REVERSED,
    created_date: new Date().toISOString(),
  };
}

/**
 * Check if demo mode is enabled
 */
export function isDemoModeEnabled(): boolean {
  return process.env.DEMO_PAYMENTS_ENABLED === "true";
}

/**
 * Get demo mode base URL
 */
export function getDemoBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

/**
 * Create a demo webhook payload
 */
export function createDemoWebhookPayload(orderTrackingId: string, merchantReference: string) {
  return {
    OrderTrackingId: orderTrackingId,
    OrderNotificationType: "IPNCHANGE",
    OrderMerchantReference: merchantReference,
  };
}

/**
 * Trigger a demo webhook call with proper UUID handling
 */
export async function triggerDemoWebhook(
  orderTrackingId: string,
  merchantReference: string,
  forceOutcome?: "success" | "failure"
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = getDemoBaseUrl();
    
    // Ensure we have a valid UUID for the tracking ID
    const validOrderTrackingId = orderTrackingId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
      ? orderTrackingId 
      : crypto.randomUUID();
    
    // First update transaction status if forcing outcome
    if (forceOutcome) {
      await fetch(`${baseUrl}/api/demo-payments?orderTrackingId=${validOrderTrackingId}&forceOutcome=${forceOutcome}`);
    }

    // Trigger webhook
    const webhookPayload = createDemoWebhookPayload(validOrderTrackingId, merchantReference);
    const response = await fetch(`${baseUrl}/api/webhooks/pesapal/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Simulate processing delay
 */
export async function simulateProcessingDelay(settings: DemoSettings = DEFAULT_DEMO_SETTINGS): Promise<void> {
  if (settings.simulateDelay) {
    const delay = Math.floor(Math.random() * settings.maxDelay);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}