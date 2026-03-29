import { Router, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest, AppError } from '../types';
import { sanitizeText } from '../utils/sanitize';

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post(
  '/register',
  validate({
    email: { required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'A valid email is required.' },
    password: { required: true, type: 'string', minLength: 8, pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: 'Password must be at least 8 characters and contain at least one letter and one number.' },
    displayName: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const displayName = sanitizeText(req.body.displayName);

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new AppError(409, 'An account with that email already exists.');
      }

      const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          displayName,
        },
      });

      const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      });

      res.cookie('auth_token', token, AUTH_COOKIE_OPTIONS);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          membershipTier: user.membershipTier,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  validate({
    email: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });

      // Timing-safe: always hash even for non-existent users to prevent user enumeration
      if (!user) {
        await bcrypt.hash(password, config.bcryptRounds);
        throw new AppError(401, 'Invalid email or password.');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new AppError(401, 'Invalid email or password.');
      }

      const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      });

      res.cookie('auth_token', token, AUTH_COOKIE_OPTIONS);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          membershipTier: user.membershipTier,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          membershipTier: true,
          membershipExpiresAt: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new AppError(404, 'User not found.');
      }

      res.json({ user });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout
router.post('/logout', (_req, res: Response) => {
  res.clearCookie('auth_token', { path: '/' });
  res.json({ message: 'Logged out successfully.' });
});

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  validate({
    email: { required: true, type: 'string' },
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });

      // Always return success to avoid email enumeration
      if (!user) {
        res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
        return;
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry,
        },
      });

      // In a real app, send an email with the reset link
      const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
      console.log(`[Password Reset] Reset URL for ${email}: ${resetUrl}`);

      res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  validate({
    token: { required: true, type: 'string' },
    password: { required: true, type: 'string', minLength: 8, pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: 'Password must be at least 8 characters and contain at least one letter and one number.' },
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body;

      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await prisma.user.findFirst({
        where: {
          resetToken: hashedToken,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        throw new AppError(400, 'Invalid or expired reset token.');
      }

      const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      // Clear any existing auth cookie
      res.clearCookie('auth_token', { path: '/' });

      res.json({ message: 'Password reset successfully. Please log in with your new password.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
