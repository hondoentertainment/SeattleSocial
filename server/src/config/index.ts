const DEFAULT_JWT_SECRET = 'dev-secret-change-in-production';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  jwtExpiresIn: '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  bcryptRounds: 12,
} as const;

// Production startup validation
if (config.nodeEnv === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_JWT_SECRET) {
    throw new Error(
      'FATAL: JWT_SECRET must be set to a strong, unique value in production. ' +
      'Do not use the default secret.'
    );
  }

  if (!config.stripe.secretKey) {
    throw new Error(
      'FATAL: STRIPE_SECRET_KEY must be configured in production.'
    );
  }
}
