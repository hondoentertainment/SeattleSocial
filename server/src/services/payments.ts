import Stripe from 'stripe';
import { config } from '../config';

let stripe: Stripe | null = null;

/**
 * Initialize Stripe only if a secret key is configured.
 * All payment methods gracefully degrade when Stripe is unavailable.
 */
function getStripe(): Stripe | null {
  if (stripe) return stripe;
  if (config.stripe.secretKey) {
    stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    });
    return stripe;
  }
  return null;
}

export function isStripeConfigured(): boolean {
  return !!config.stripe.secretKey;
}

/**
 * Create a Stripe PaymentIntent for an event booking.
 * Returns null if Stripe is not configured (mock mode).
 */
export async function createPaymentIntent(
  amount: number,
  currency: string,
  metadata: Record<string, string>
): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  const client = getStripe();
  if (!client) {
    // Mock mode: return a fake payment intent for development
    const mockId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    return {
      clientSecret: `${mockId}_secret_mock`,
      paymentIntentId: mockId,
    };
  }

  const paymentIntent = await client.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    metadata,
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Verify a Stripe webhook signature.
 * Returns the parsed event or null if Stripe is not configured.
 */
export function constructWebhookEvent(
  payload: Buffer,
  signature: string
): Stripe.Event | null {
  const client = getStripe();
  if (!client || !config.stripe.webhookSecret) {
    return null;
  }

  return client.webhooks.constructEvent(
    payload,
    signature,
    config.stripe.webhookSecret
  );
}

/**
 * Create a Stripe checkout session for membership upgrade.
 * Returns null if Stripe is not configured (mock mode).
 */
export async function createMembershipCheckout(
  tier: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionUrl: string; paymentIntentId: string } | null> {
  const client = getStripe();

  const prices: Record<string, number> = {
    PREMIUM: 999,       // $9.99/month in cents
    PREMIUM_PLUS: 1999, // $19.99/month in cents
  };

  const priceAmount = prices[tier];
  if (!priceAmount) return null;

  if (!client) {
    // Mock mode
    const mockId = `pi_mock_membership_${Date.now()}`;
    return {
      sessionUrl: `${config.clientUrl}/membership/success?mock=true`,
      paymentIntentId: mockId,
    };
  }

  const session = await client.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `SeattleSocial ${tier.replace('_', ' ')} Membership`,
          },
          unit_amount: priceAmount,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, tier },
  });

  return {
    sessionUrl: session.url!,
    paymentIntentId: session.payment_intent as string || `cs_${session.id}`,
  };
}
