const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const rsvpsRoutes = require('./routes/rsvps');
const usersRoutes = require('./routes/users');
const organizerRoutes = require('./routes/organizer');
const paymentsRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Raw body for Stripe webhooks must come before json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/rsvps', rsvpsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/payments', paymentsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`SeattleSocial API running on http://localhost:${PORT}`);
});

module.exports = app;
