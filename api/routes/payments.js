const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const PLANS = {
  premium: { price: 1499, name: 'Premium', interval: 'month' },
  'premium-plus': { price: 2999, name: 'Premium Plus', interval: 'month' }
};

router.post('/create-checkout', requireAuth, async (req, res) => {
  const { tier } = req.body;
  if (!PLANS[tier]) return res.status(400).json({ error: 'Invalid membership tier' });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey === 'sk_test_placeholder') {
    return res.status(200).json({
      mockCheckout: true,
      tier,
      plan: PLANS[tier],
      message: 'Stripe not configured — this is a demo checkout'
    });
  }

  try {
    const stripe = require('stripe')(stripeKey);
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    let customerId = db.prepare('SELECT stripe_customer_id FROM memberships WHERE user_id = ?').get(req.user.id)?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `SeattleSocial ${PLANS[tier].name}` },
          unit_amount: PLANS[tier].price,
          recurring: { interval: PLANS[tier].interval }
        },
        quantity: 1
      }],
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/profile?upgraded=true`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/profile`
    });

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Payment processing error', details: err.message });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) return res.sendStatus(200);

  const stripe = require('stripe')(stripeKey);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const db = getDb();
    const customer = await stripe.customers.retrieve(session.customer);
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(customer.email);
    if (user) {
      db.prepare(`
        INSERT INTO memberships (user_id, tier, stripe_customer_id, stripe_subscription_id)
        VALUES (?, 'premium', ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET tier = 'premium', stripe_subscription_id = excluded.stripe_subscription_id
      `).run(user.id, session.customer, session.subscription);
      db.prepare("UPDATE users SET membership_tier = 'premium' WHERE id = ?").run(user.id);
    }
  }

  res.sendStatus(200);
});

module.exports = router;
