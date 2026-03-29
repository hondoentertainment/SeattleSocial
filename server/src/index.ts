import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { csrfProtection } from './middleware/csrf';
import { openApiSpec } from './docs/openapi';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import bookingRoutes from './routes/bookings';
import userRoutes from './routes/users';
import notificationRoutes from './routes/notifications';
import paymentRoutes from './routes/payments';

const app = express();

// CORS
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// Cookie parser
app.use(cookieParser());

// Request logging
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// Rate limiting - global
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests, please try again later.', statusCode: 429 } },
});
app.use(globalLimiter);

// Rate limiting - auth routes (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many authentication attempts, please try again later.', statusCode: 429 } },
});

// Rate limiting - payment routes
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many payment requests, please try again later.', statusCode: 429 } },
});

// Stripe webhook needs raw body — must be before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }));

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// CSRF protection (after cookie-parser, before routes)
app.use(csrfProtection);

// API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Health check
app.get('/api/health', (_req, res) => {
  const response: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  // Only expose environment in non-production
  if (config.nodeEnv !== 'production') {
    response.environment = config.nodeEnv;
  }

  res.json(response);
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Route not found.', statusCode: 404 } });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`SeattleSocial API running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Stripe configured: ${!!config.stripe.secretKey}`);
});

export default app;
