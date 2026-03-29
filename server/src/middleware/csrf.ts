import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

/**
 * CSRF protection middleware.
 * - GET /api/auth/csrf-token: generates and returns a CSRF token (also stored in a cookie).
 * - POST/PUT/DELETE requests: verifies that the X-CSRF-Token header matches the csrf_token cookie.
 * - Skips the Stripe webhook endpoint (it uses its own signature verification).
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Serve CSRF token on dedicated endpoint
  if (req.method === 'GET' && req.path === '/api/auth/csrf-token') {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,   // client JS needs to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });
    res.json({ csrfToken: token });
    return;
  }

  // Only check state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    next();
    return;
  }

  // Skip CSRF for Stripe webhook (uses its own signature verification)
  if (req.path === '/api/payments/webhook') {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({
      error: {
        message: 'CSRF token validation failed.',
        statusCode: 403,
        code: 'CSRF_ERROR',
      },
    });
    return;
  }

  next();
}
