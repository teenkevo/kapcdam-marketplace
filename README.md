# KAPCDAM Marketplace

A modern e-commerce platform built with Next.js, featuring dual payment methods (Pesapal & Cash on Delivery), real-time stock management, and comprehensive order processing.

## Features

- 🛒 **Smart Cart Management** - Real-time inventory tracking with stock validation
- 💳 **Dual Payment Methods** - Pesapal integration + Cash on Delivery
- 📦 **Stock Management** - Automatic stock reduction and restoration with audit trails
- 🔐 **Secure Authentication** - Clerk-powered user management
- 📱 **Responsive Design** - Mobile-first approach with modern UI
- 🎯 **Order Tracking** - Complete order lifecycle from cart to delivery
- 🏷️ **Coupon System** - Flexible discount management with usage tracking

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Sanity CMS account
- Clerk account  
- Pesapal merchant account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd kapcdam-marketplace
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
```

Fill in the required environment variables:
- `NEXT_PUBLIC_SANITY_PROJECT_ID` - Your Sanity project ID
- `NEXT_PUBLIC_SANITY_DATASET` - Your Sanity dataset name
- `NEXT_PUBLIC_BASE_URL` - Your local development URL
- `SANITY_API_READ_TOKEN` - Sanity read token
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `PESAPAL_API_URL` - Pesapal API endpoint
- `PESAPAL_CONSUMER_KEY` - Your Pesapal consumer key
- `PESAPAL_CONSUMER_SECRET` - Your Pesapal consumer secret

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Cart to Order Flow

### Overview
Our marketplace implements a robust cart-to-order system with multiple payment options and comprehensive error handling.

### Flow Stages

#### 1. **Cart Management**
- Users add products/courses to cart
- Real-time stock validation
- Quantity management with stock limits
- Cart persistence across sessions

#### 2. **Checkout Process**
- **Authentication**: Clerk-protected checkout flow
- **Address Validation**: Existing addresses only (security)
- **Delivery Options**: Pickup or local delivery with zone-based pricing
- **Payment Methods**: Pesapal (online) or COD (cash on delivery)
- **Coupon System**: Real-time discount application and validation

#### 3. **Order Creation** 
- **Stock Handling**:
  - COD orders: Stock reduced immediately
  - Pesapal orders: Stock reduced on payment confirmation
- **Order Generation**: Unique order numbers (KAPC-YYYY-XXX format)
- **Data Structure**: Amazon-style item naming and pricing breakdown

#### 4. **Payment Processing**

**Cash on Delivery (COD):**
- Immediate order confirmation
- Stock reduced at order creation
- Direct redirect to success page

**Pesapal Integration:**
- Automatic payment gateway redirect
- IPN (webhook) callback handling
- Transaction status verification
- Stock reduction on payment confirmation

#### 5. **Order States**
```
Cart → Checkout → Order Created → Payment Processing → Completion

COD Flow:
Cart → Checkout → Order (confirmed) → Success Page

Pesapal Flow:  
Cart → Checkout → Order (pending) → Gateway → Callback → Success/Failure
```

#### 6. **Error Handling & Recovery**
- **Failed Payments**: Retry mechanisms with sessionStorage guards
- **Stock Conflicts**: Automatic restoration for cancelled orders
- **Gateway Issues**: Comprehensive callback error handling
- **Infinite Loops**: SessionStorage retry guards prevent double-processing

### Technical Architecture

**Frontend:**
- Next.js 15 with App Router
- React Query for state management
- nuqs for URL state synchronization
- Clerk authentication

**Backend:**
- tRPC for type-safe API procedures
- Sanity CMS for data persistence
- Pesapal API integration
- Webhook handling for payment callbacks

**Key Security Features:**
- Order ownership verification
- Webhook authentication
- Input validation with Zod schemas
- Rate limiting on webhook endpoints

## Development

### Project Structure
```
src/
├── app/                    # Next.js app router pages
├── features/              # Feature-based modules
│   ├── cart/             # Cart management
│   ├── checkout/         # Checkout flow
│   ├── orders/           # Order processing
│   ├── payments/         # Payment integration
│   └── products/         # Product catalog
├── trpc/                 # tRPC configuration
└── sanity/               # Sanity CMS setup
```

### Key Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
```

## Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Configuration
- **Development**: Uses `NEXT_PUBLIC_BASE_URL`
- **Production**: Uses `NEXT_PUBLIC_BASE_URL_PROD`
- **Localhost HTTPS Fix**: Automatic conversion from https://localhost to http://localhost

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.
