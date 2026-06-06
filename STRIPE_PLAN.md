# Wedding Steward: Stripe Integration Plan

This document outlines the architecture, data models, and flow diagrams for integrating Stripe into the Wedding Steward application. The integration serves two main business requirements:
1. **Platform Monetization**: Subscribing couples to premium tier plans (e.g. custom domain, ad-free site, unlimited photos).
2. **Couples' Cash Registries (Stripe Connect)**: Allowing couples to securely receive honeymoon/cash fund gifts directly from guests on their public wedding website.

---

## 1. Platform Monetization (Stripe Billing)

Couples subscribe to premium features using Stripe Checkout and manage their subscriptions via the Stripe Customer Portal.

### Workflow & Architecture
1. **Checkout Session Initiated**: 
   * User clicks "Upgrade to Premium" in the Settings panel.
   * Client-side hits Next.js route: `/api/stripe/checkout`.
   * Backend generates a Stripe Checkout Session using `stripe.checkout.sessions.create` containing the logged-in user's details and metadata (`weddingId`).
   * Redirects user to Stripe Checkout hosting.
2. **Payment Processing**:
   * User enters payment information on Stripe's secure page.
   * Stripe handles PCI-compliance, 3D-Secure authentication, and card validation.
3. **Webhook Callback**:
   * Stripe fires `checkout.session.completed` event to `/api/stripe/webhook`.
   * Backend verifies the signature with Stripe SDK webhook secret.
   * Backend updates the `Wedding` model in DynamoDB (e.g., setting `tier` or custom domain capabilities based on the payment success).
4. **Subscription Management**:
   * Settings page displays a "Manage Subscription" button linking to `/api/stripe/portal`.
   * Backend generates a Stripe Customer Portal link and redirects the user, allowing them to update cards or cancel subscriptions.

---

## 2. Honeymoon & Cash Funds (Stripe Connect Express)

To allow couples to receive funds directly without Wedding Steward acting as a bank, we will implement **Stripe Connect** (Direct Charges or Destination Charges). 

### Setup Workflow (Couples)
1. **Initiate Connect**:
   * In Settings, the couple clicks "Connect Stripe to Accept Cash Gifts".
   * Backend calls `stripe.oauth.token` or generates a Connect Onboarding Account Link (`stripe.accountLinks.create`) using Express Accounts.
   * Couple completes the onboarding flow on Stripe (bank account, details) and is redirected back to `/settings?stripe_connect=success`.
2. **Save Account Details**:
   * Backend receives the OAuth code, exchanges it for a `stripe_user_id` (connected account ID).
   * Saves `stripeConnectedAccountId` to the `Wedding` model.

### Gift Payment Workflow (Wedding Guests)
1. **Registry View**:
   * Guest navigates to the public registry page (`/w/[slug]/registry`).
   * Guest selects a cash fund (e.g. "Honeymoon Flights") and enters the gift amount.
2. **Checkout Integration**:
   * Guest clicks "Send Gift".
   * Frontend calls `/api/stripe/registry/create-payment-intent` passing the `weddingId` and amount.
   * Backend retrieves the couple's `stripeConnectedAccountId` from the database.
   * Backend creates a `PaymentIntent` with:
     * **Direct Charge** or **Destination Charge** (transferring funds to the couple's connected Stripe ID).
     * Optional **Application Fee** (e.g., 1-2% platform convenience fee for Wedding Steward).
3. **Payment Element**:
   * The client renders Stripe's `PaymentElement` in a modal.
   * Guest completes the checkout.
   * Stripe triggers `payment_intent.succeeded` webhook.
   * Webhook updates the guestbook or gift record in DynamoDB, showing a confirmed payment to the couple.

---

## 3. Database Schema Updates (`amplify/data/resource.ts`)

We need to add Stripe references to our models.

### Proposed Field Additions
```typescript
  Wedding: a
    .model({
      // Existing fields...
      stripeCustomerId: a.string(),            // For platform billing
      stripeSubscriptionId: a.string(),        // Active subscription track
      subscriptionStatus: a.string(),          // active, trialing, past_due, canceled
      stripeConnectedAccountId: a.string(),    // For cash fund Connect integration
      premiumTierEnabled: a.boolean().default(false),
    }),

  WebsiteRegistry: a
    .model({
      // Existing fields...
      isCashFund: a.boolean().default(false),
      cashFundGoal: a.float(),
      cashFundReceived: a.float().default(0.0),
    })
```

---

## 4. API Endpoint Structure (Next.js API Routes)

All Stripe communication is securely handled on the server side:

```text
src/app/api/stripe/
├── checkout/route.ts       # Creates Stripe Billing Checkout sessions
├── portal/route.ts         # Generates Stripe Customer Portal URLs
├── webhook/route.ts        # Listens to billing events (checkout.session.completed)
└── registry/
    ├── connect/route.ts    # Initiates/completes Stripe OAuth onboarding
    ├── pay-intent/route.ts # Creates destination charges payment intents
    └── webhook/route.ts    # Listens to Connect payment events
```

---

## 5. Webhook Signature Verification Security

Any webhook endpoint must strictly verify headers to prevent forgery:
```typescript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      // Update Database
      break;
    // ...
  }

  return NextResponse.json({ received: true });
}
```
