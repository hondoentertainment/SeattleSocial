import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest, AppError, param } from '../types';
import { parsePagination, paginate } from '../utils/helpers';

const router = Router();
const prisma = new PrismaClient();

// GET /api/notifications
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = parsePagination(req.query as Record<string, unknown>);
      const userId = req.userId!;

      const where = { userId };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          include: {
            event: { select: { id: true, title: true, slug: true, imageUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      res.json(paginate(notifications, total, { page, limit }));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/notifications/unread-count
router.get(
  '/unread-count',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const count = await prisma.notification.count({
        where: { userId: req.userId!, isRead: false },
      });
      res.json({ count });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/notifications/read-all
router.put(
  '/read-all',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.userId!, isRead: false },
        data: { isRead: true },
      });
      res.json({ message: 'All notifications marked as read.' });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/notifications/:id/read
router.put(
  '/:id/read',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const notifId = param(req, 'id');
      const notification = await prisma.notification.findUnique({
        where: { id: notifId },
      });

      if (!notification) throw new AppError(404, 'Notification not found.');
      if (notification.userId !== req.userId) {
        throw new AppError(403, 'You can only manage your own notifications.');
      }

      await prisma.notification.update({
        where: { id: notifId },
        data: { isRead: true },
      });

      res.json({ message: 'Notification marked as read.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
