# Pesapal Webhook Status Reference

## When Webhooks Are Sent
- **Payment status changes** (pending → completed/failed)
- **Recurring payment processed** 
- **Payment reversed/refunded**
- **Background notifications** (user may not be on site)
- **Reliable delivery** (Pesapal retries if your server fails)

## Webhook Payload
```json
{
  "OrderTrackingId": "b945e4af-80a5-4ec1-8706-e03f8332fb04",
  "OrderNotificationType": "IPNCHANGE", 
  "OrderMerchantReference": "KAPC-2025-001"
}
```

## Notification Types
- **`IPNCHANGE`** - Standard payment status change
- **`RECURRING`** - Recurring/subscription payment processed
- **`CALLBACKURL`** - User callback (not typically in webhooks)

## Payment Statuses (from GetTransactionStatus)
- **`Completed`** / **`COMPLETED`** - Payment successful ✅
- **`Failed`** / **`FAILED`** - Payment failed ❌
- **`Pending`** / **`PENDING`** - Still processing ⏳
- **`Invalid`** / **`INVALID`** - Transaction not found ❓
- **`Reversed`** / **`REVERSED`** - Payment refunded/charged back 🔄

## Required Webhook Response
```json
{
  "orderNotificationType": "IPNCHANGE",
  "orderTrackingId": "b945e4af-80a5-4ec1-8706-e03f8332fb04", 
  "orderMerchantReference": "KAPC-2025-001",
  "status": 200
}
```

## Response Status Codes
- **`200`** - Webhook processed successfully ✅
- **`500`** - Error processing webhook (Pesapal will retry) ❌

## Critical Points
- **No payment status in webhook** - Must call `GetTransactionStatus` API
- **Must respond with JSON** - Pesapal needs confirmation you processed it
- **Idempotent processing** - Same webhook may be sent multiple times
- **Timeout handling** - Respond within 30 seconds or Pesapal retries
- **Security** - Webhooks come from pesapal.com domain only

## Implementation Checklist
- [ ] Register IPN URL with Pesapal (`RegisterIPN` endpoint)
- [ ] Handle POST requests to your webhook endpoint
- [ ] Extract `OrderTrackingId` from webhook payload
- [ ] Call `GetTransactionStatus` to get actual payment status
- [ ] Update your database/business logic based on status
- [ ] Return proper JSON response to Pesapal
- [ ] Handle duplicate notifications (idempotent processing)
- [ ] Log webhook events for debugging

## Error Handling
- **Network timeouts** - Pesapal retries failed deliveries
- **Invalid OrderTrackingId** - Log error, return status 500
- **Database errors** - Return status 500, let Pesapal retry
- **Duplicate processing** - Check if already processed, return 200

## Testing
- **Sandbox URL**: `https://cybqa.pesapal.com/pesapalv3/api`
- **Production URL**: `https://pay.pesapal.com/v3/api`
- Use test payments to verify webhook delivery
- Check webhook logs in Pesapal dashboard