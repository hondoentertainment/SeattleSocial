import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest, AppError } from '../types';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post(
  '/register',
  validate({
    email: { required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'A valid email is required.' },
    password: { required: true, type: 'string', minLength: 8, message: 'Password must be at least 8 characters.' },
    displayName: { required: true, type: 'string', minLength: 2, maxLength: 50 },
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password, displayName } = req.body;

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
      if (!user) {
        throw new AppError(401, 'Invalid email or password.');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new AppError(401, 'Invalid email or password.');
      }

      const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      });

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

export default router;
