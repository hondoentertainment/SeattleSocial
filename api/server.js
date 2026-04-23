// ── Startup validation ─────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
const DEFAULT_SECRET = 'seattlesocial-dev-secret-change-in-production';
if (process.env.NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET === DEFAULT_SECRET || JWT_SECRET.length < 32)) {
  console.error('FATAL: JWT_SECRET must be set to a random string of at least 32 characters in production.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const rsvpsRoutes = require('./routes/rsvps');
const usersRoutes = require('./routes/users');
const organizerRoutes = require('./routes/organizer');
const paymentsRoutes = require('./routes/payments');
const friendsRoutes = require('./routes/friends');
const sseRoutes = require('./routes/sse');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security middleware ────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // allow images across origins
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Global rate limit: 200 req/15min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
}));

// Stricter limit on auth endpoints: 20 req/15min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later.' }
});

// Raw body for Stripe webhooks must come before json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '100kb' }));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/rsvps', rsvpsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/sse', sseRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err.stack);
  res.status(status).json({ error: err.message || 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`SeattleSocial API running on http://localhost:${PORT}`);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully`);
  server.close(() => {
    try {
      const { getDb } = require('./db');
      getDb().close();
    } catch { /* db may not be initialized */ }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000); // force-kill after 10s
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
