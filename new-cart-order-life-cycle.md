

# Simplified Cart Lifecycle

## Phase 1: Anonymous Cart
- User visits site → localStorage cart created if none exists
- Add/remove items → update localStorage
- Cart persists across browser sessions

## Phase 2: Login & Sync  
- User logs in → check for existing server cart
- **If server cart exists + localStorage cart exists** → merge both, server wins conflicts
- **If only localStorage exists** → move to server
- Clear localStorage → server cart now single source of truth

## Phase 3: Order Creation
- User clicks "Place Order" → immediately create Order in Sanity:
  - `paymentStatus: "pending"`
  - `status: "pending"`  
  - Generate unique `orderNumber`
- Clear user's server cart immediately
- Redirect to `/checkout/[orderId]`

## Phase 4: Payment Flow
**On `/checkout/[orderId]` page:**
- Fetch orde
r by ID
- **If `paymentStatus === "pending"`** → auto-initiate Pesapal payment
- **If `paymentStatus === "paid"`** → redirect to success page  
- **If `paymentStatus === "failed"`** → show retry options

**Pesapal Integration:**
- Call Pesapal API → get payment URL
- Redirect user to Pesapal
- User completes payment → Pesapal redirects to `/checkout/[orderId]/callback`

## Phase 5: Payment Outcomes

**Success Flow:**
- Pesapal webhook hits `/api/webhooks/pesapal`
- Verify payment status with Pesapal API
- Update order: `paymentStatus: "paid"`, `status: "processing"`
- User redirected to `/checkout/[orderId]/success`

**Failure Flow:**
- Pesapal webhook/callback indicates failure
- Update order: `paymentStatus: "failed"`
- User sees retry UI on `/checkout/[orderId]`

**Back Button Scenario:**
- User hits back from Pesapal → lands on `/checkout/[orderId]`
- Page checks order status → shows "Continue Payment" button
- No complex recovery logic needed

## Phase 6: Edge Cases

**User abandons payment:**
- Order remains with `paymentStatus: "pending"` or `"failed"`
- User can return to `/checkout/[orderId]` anytime to retry
- No cart recovery needed - order contains all data

**Retry payment:**
- Generate new Pesapal payment session
- Keep same order, update `transactionId`
- User completes payment normally

**Cancel order:**
- Update `status: "cancelled"`
- User redirected to empty cart

## Order Status Fields

**paymentStatus:**
- `"pending"` → payment not completed
- `"paid"` → payment successful
- `"failed"` → payment failed, can retry

**status (fulfillment):**
- `"pending"` → awaiting payment
- `"processing"` → payment received, preparing
- `"shipped"` → order dispatched
- `"delivered"` → order completed
- `"cancelled"` → order cancelled

## Key Benefits
- Clean URLs: `/checkout/abc123`
- Simple back button handling
- No complex cart recovery logic
- Pesapal-friendly flow
- Easy retry mechanism
- Single source of truth per phase