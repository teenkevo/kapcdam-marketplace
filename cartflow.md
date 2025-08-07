when# Order Flow Analysis - Kapcdam Marketplace

## Complete Order Journey: Cart → Success/Failure

### **Phase 1: Checkout Initiation**
**Entry Point:** User clicks "Proceed to Checkout" in cart sheet

**Flow:**
1. **Authentication Check** (`/checkout` page)
   - Requires authenticated user via Clerk
   - Redirects unauthenticated users to `/sign-in?redirect_url=/checkout`

2. **Cart Validation** (`CheckoutView`)
   - Fetches user cart via `trpc.cart.getUserCart`
   - Empty cart → Shows "Your Cart is Empty" message + redirect to marketplace
   - Valid cart → Proceeds to checkout form

3. **Form Handling** (`CheckoutForm` + `useCheckoutForm`)
   - Validates shipping address (existing addresses only)
   - Validates delivery method (pickup/local_delivery) 
   - Validates payment method (pesapal/cod)
   - Calculates shipping costs based on delivery zones
   - Handles coupon application with real-time validation

---

### **Phase 2: Order Creation**
**Trigger:** User clicks "Place Order" button

**Process:**
1. **Form Validation** (`handlePlaceOrder`)
   - Ensures all required fields completed
   - Validates cart still exists and has items

2. **Order Creation** (`trpc.orders.createOrder`)
   - Generates unique order number (KAPC-YYYY-XXX format)
   - Creates order document in Sanity with:
     - Customer reference (Clerk user)
     - Order items with Amazon-style naming
     - Pricing calculations (subtotal, shipping, discounts, total)
     - Simplified discount structure: `{couponApplied: "TEST20 20% OFF", discountAmount: 5000}`
     - Payment/delivery details
   - Creates individual orderItem documents with references
   - **Critical:** Cart is NOT cleared at this stage

3. **Success Handling**
   - Shows "Order created successfully" toast
   - Clears cart cache aggressively (4 different invalidation methods)
   - **Redirects to** `/checkout/{orderId}` (order-specific page)

---

### **Phase 3: Payment Processing Hub**
**Location:** `/checkout/{orderId}` (`OrderCheckoutView`)

**Smart Routing Logic:**
1. **Order Status Check**
   - `paid` → Redirect to `/checkout/{orderId}/success`
   - `failed` → Redirect to `/checkout/{orderId}/failed`
   - COD + pending → Redirect to `/checkout/{orderId}/success`
   - Pesapal + pending → Continue with payment flow

2. **Session-Based Payment Control** (Edge Case Handling)
   - Uses `sessionStorage` key `payment-initiated-{orderId}`
   - **First Visit:** Automatically initiates payment → Shows processing screen
   - **Return Visit:** Shows UI with retry/cancel options
   - Prevents double payment initiation

3. **Payment Initiation** (`processOrderPayment`)
   - Registers IPN endpoint with Pesapal
   - Creates payment request with order details
   - Callback URL: `/api/payment/callback?orderId={orderId}`
   - **Redirects user to Pesapal gateway**

---

### **Phase 4: Gateway & Callback Handling**

**User Experience at Gateway:**
- User completes/abandons payment at Pesapal
- Gateway redirects to callback URL regardless of outcome

**Callback Processing** (`/api/payment/callback`):
1. **Parameter Extraction**
   - `OrderTrackingId` (from Pesapal)
   - `orderId` (from our callback URL)

2. **Transaction Status Check**
   - Calls Pesapal API for transaction details
   - Maps status: "Completed"/"COMPLETED" → "paid", others → "failed"

3. **Order Update**
   - Updates order `paymentStatus` and `transactionId`
   - Sets `paidAt` timestamp for successful payments

4. **Final Redirect**
   - Success → `/checkout/{orderId}/success`
   - Failure → `/checkout/{orderId}` (back to payment hub)

---

### **Phase 5: Final Destinations**

#### **Success Flow** (`/checkout/{orderId}/success`)
- Shows `OrderSuccessView` with order details
- Displays items with Amazon-style names
- Shows discount as "Discount (TEST20 20% OFF): -UGX 5,000"
- Order summary with all pricing breakdown
- Links to continue shopping

#### **Failure Flow** (`/checkout/{orderId}/failed`)
- 
- **Cancel Order:** Sets order status to "cancellShows `PaymentFailedView` with retry options
- **Retry Payment:** Re-initiates payment flow (same order)ed"
- **Back to Checkout:** Returns to main checkout page

---

## **Edge Cases & Error Handling**

### **1. User Clicks Back from Gateway**
**Scenario:** User navigates back after being redirected to Pesapal

**Handling:**
- Returns to `/checkout/{orderId}` (payment hub)
- Session storage shows "return visit" → UI displayed
- Options: Retry payment, cancel order, or back to checkout

### **2. Multiple Payment Attempts**
**Prevention:**
- Session storage prevents double initiation on first visit
- Return visits show explicit retry button
- Each retry creates new Pesapal session

### **3. Gateway Timeout/Error**
**Handling:**
- Callback receives no `OrderTrackingId` → Redirects to order page
- API errors → Redirects to order page with retry option
- Transaction status errors → Order remains in pending state

### **4. Invalid Order Access**
**Protection:**
- All order operations verify user ownership via Clerk user ID
- Unauthorized access → 404/403 responses
- Missing orders → "Order Not Found" screens

### **5. Order State Conflicts**
**Resolution:**
- Orders can only be cancelled if in "pending" state
- Payment retries only work for "failed" or "pending" orders
- Status transitions: pending → paid/failed → cancelled (if pending)

### **6. Cart Synchronization**
**Cache Management:**
- Aggressive cache invalidation after order creation (4 different methods)
- Cart cleared from both server and local storage
- Display data refreshed to show empty cart

### **7. COD (Cash on Delivery) Orders**
**Simplified Flow:**
- Skips payment gateway entirely
- Order created → Directly to success page
- Status remains "pending" until manual fulfillment

---

## **Technical Architecture**

### **Key Components:**
- **Frontend:** Next.js with TypeScript, React Query, Zustand
- **Backend:** tRPC procedures, Sanity CMS
- **Payment:** Pesapal gateway integration
- **Auth:** Clerk authentication

### **Data Flow:**
1. Cart (Sanity) → Order Creation (Sanity)
2. Order → Payment Gateway (Pesapal) → Callback (API route)
3. Callback → Order Update (Sanity) → User Redirect

### **Session Management:**
- Clerk handles user authentication
- Session storage prevents payment double-initiation
- Order ownership verified on every operation

### **Error Recovery:**
- Multiple retry mechanisms at each stage
- Graceful fallbacks for network failures
- Clear user feedback for all error states

---

## **Order States Lifecycle**
```
Cart Items → [Place Order] → Order Created (pending)
    ↓
Payment Processing → Gateway → Callback
    ↓                    ↓
Success              Failure/Timeout
    ↓                    ↓
Order (paid)       Order (pending) → Retry/Cancel
    ↓                    ↓
Success Page      Payment Hub or Cancelled
```

This flow ensures robust order processing with comprehensive error handling and recovery mechanisms.