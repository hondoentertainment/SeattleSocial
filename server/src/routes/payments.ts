import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest, AppError } from '../types';
import { config } from '../config';
import {
  createPaymentIntent,
  constructWebhookEvent,
  createMembershipCheckout,
  isStripeConfigured,
} from '../services/payments';

const router = Router();
const prisma = new PrismaClient();

// POST /api/payments/checkout
router.post(
  '/checkout',
  authenticate,
  validate({
    eventId: { required: true, type: 'string' },
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { eventId, ticketCount = 1 } = req.body;
      const userId = req.userId!;

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) throw new AppError(404, 'Event not found.');

      if (event.price <= 0) {
        throw new AppError(400, 'This is a free event. Use the bookings endpoint instead.');
      }

      const tickets = Math.max(1, Math.min(ticketCount, 10));
      const amount = event.price * tickets;

      const result = await createPaymentIntent(amount, 'usd', {
        userId,
        eventId,
        ticketCount: String(tickets),
      });

      if (!result) {
        throw new AppError(500, 'Payment service unavailable.');
      }

      // Create pending payment record
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount,
          currency: 'usd',
          stripePaymentIntentId: result.paymentIntentId,
          status: 'PENDING',
          type: 'EVENT_BOOKING',
        },
      });

      // In mock mode, auto-succeed the payment
      if (!isStripeConfigured()) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'SUCCEEDED' },
        });
      }

      res.json({
        clientSecret: result.clientSecret,
        paymentId: payment.id,
        amount,
        mock: !isStripeConfigured(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/payments/webhook
// This route needs raw body — configured in index.ts
router.post(
  '/webhook',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isStripeConfigured()) {
        res.json({ received: true, mock: true });
        return;
      }

      const signature = req.headers['stripe-signature'] as string;
      if (!signature) {
        throw new AppError(400, 'Missing Stripe signature.');
      }

      const event = constructWebhookEvent(req.body as Buffer, signature);
      if (!event) {
        throw new AppError(400, 'Invalid webhook event.');
      }

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as { id: string; metadata: Record<string, string> };
          await prisma.payment.updateMany({
            where: { stripePaymentIntentId: paymentIntent.id },
            data: { status: 'SUCCEEDED' },
          });

          // Auto-create booking if payment was for an event
          const { userId, eventId, ticketCount } = paymentIntent.metadata;
          if (userId && eventId) {
            const existingBooking = await prisma.booking.findUnique({
              where: { userId_eventId: { userId, eventId } },
            });
            if (!existingBooking) {
              const evt = await prisma.event.findUnique({ where: { id: eventId } });
              const tickets = parseInt(ticketCount || '1', 10);
              await prisma.booking.create({
                data: {
                  userId,
                  eventId,
                  status: 'CONFIRMED',
                  ticketCount: tickets,
                  totalPaid: (evt?.price || 0) * tickets,
                },
              });
            }
          }
          break;
        }
        case 'payment_intent.payment_failed': {
          const failedIntent = event.data.object as { id: string };
          await prisma.payment.updateMany({
            where: { stripePaymentIntentId: failedIntent.id },
            data: { status: 'FAILED' },
          });
          break;
        }
      }

      res.json({ received: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/payments/membership
router.post(
  '/membership',
  authenticate,
  validate({
    tier: { required: true, type: 'string' },
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tier } = req.body;
      const userId = req.userId!;

      if (!['PREMIUM', 'PREMIUM_PLUS'].includes(tier)) {
        throw new AppError(400, 'Invalid tier. Must be PREMIUM or PREMIUM_PLUS.');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError(404, 'User not found.');

      if (user.membershipTier === tier) {
        throw new AppError(400, `You are already on the ${tier} plan.`);
      }

      const successUrl = `${config.clientUrl}/membership/success?tier=${tier}`;
      const cancelUrl = `${config.clientUrl}/membership/cancel`;

      const result = await createMembershipCheckout(tier, userId, successUrl, cancelUrl);
      if (!result) {
        throw new AppError(500, 'Payment service unavailable for this tier.');
      }

      // Create payment record
      const prices: Record<string, number> = { PREMIUM: 9.99, PREMIUM_PLUS: 19.99 };
      await prisma.payment.create({
        data: {
          userId,
          amount: prices[tier] || 0,
          currency: 'usd',
          stripePaymentIntentId: result.paymentIntentId,
          status: 'PENDING',
          type: 'MEMBERSHIP_UPGRADE',
        },
      });

      // In mock mode, auto-upgrade the user
      if (!isStripeConfigured()) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        await prisma.user.update({
          where: { id: userId },
          data: { membershipTier: tier, membershipExpiresAt: expiresAt },
        });
        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: result.paymentIntentId },
          data: { status: 'SUCCEEDED' },
        });
      }

      res.json({
        sessionUrl: result.sessionUrl,
        mock: !isStripeConfigured(),
        message: !isStripeConfigured()
          ? `Mock mode: membership upgraded to ${tier}.`
          : 'Redirect to Stripe checkout.',
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
