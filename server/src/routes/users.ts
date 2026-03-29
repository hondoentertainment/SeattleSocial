import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest, AppError, param } from '../types';
import { parsePagination, paginate, categoryFromDb, parseTags } from '../utils/helpers';
import { notifyFriendRequest } from '../services/notifications';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users/profile
router.get(
  '/profile',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const user = await prisma.user.findUnique({
        where: { id: userId },
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

      if (!user) throw new AppError(404, 'User not found.');

      const [eventsAttended, eventsOrganized, friendsCount, savedCount] = await Promise.all([
        prisma.booking.count({ where: { userId, status: 'CONFIRMED' } }),
        prisma.event.count({ where: { organizerId: userId } }),
        prisma.friendship.count({
          where: {
            status: 'ACCEPTED',
            OR: [{ requesterId: userId }, { addresseeId: userId }],
          },
        }),
        prisma.savedEvent.count({ where: { userId } }),
      ]);

      res.json({
        user,
        stats: { eventsAttended, eventsOrganized, friendsCount, savedCount },
      });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/users/profile
router.put(
  '/profile',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { displayName, avatarUrl, bio } = req.body;
      const data: Record<string, unknown> = {};
      if (displayName !== undefined) data.displayName = displayName;
      if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
      if (bio !== undefined) data.bio = bio;

      const user = await prisma.user.update({
        where: { id: req.userId! },
        data,
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          membershipTier: true,
          membershipExpiresAt: true,
        },
      });

      res.json({ user });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/users/:id/public
router.get(
  '/:id/public',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const targetId = param(req, 'id');
      const user = await prisma.user.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          membershipTier: true,
          createdAt: true,
        },
      });

      if (!user) throw new AppError(404, 'User not found.');

      const eventsAttended = await prisma.booking.count({
        where: { userId: targetId, status: 'CONFIRMED' },
      });

      res.json({ user, stats: { eventsAttended } });
    } catch (err) {
      next(err);
    }
  }
);

// --- Saved Events ---

// POST /api/users/saved-events/:eventId
router.post(
  '/saved-events/:eventId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const eventId = param(req, 'eventId');
      const userId = req.userId!;

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) throw new AppError(404, 'Event not found.');

      const existing = await prisma.savedEvent.findUnique({
        where: { userId_eventId: { userId, eventId } },
      });
      if (existing) throw new AppError(409, 'Event already saved.');

      const saved = await prisma.savedEvent.create({
        data: { userId, eventId },
      });

      res.status(201).json({ savedEvent: saved });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/users/saved-events/:eventId
router.delete(
  '/saved-events/:eventId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const eventId = param(req, 'eventId');
      const userId = req.userId!;

      const existing = await prisma.savedEvent.findUnique({
        where: { userId_eventId: { userId, eventId } },
      });
      if (!existing) throw new AppError(404, 'Saved event not found.');

      await prisma.savedEvent.delete({
        where: { userId_eventId: { userId, eventId } },
      });

      res.json({ message: 'Event unsaved.' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/users/saved-events
router.get(
  '/saved-events',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = parsePagination(req.query as Record<string, unknown>);
      const userId = req.userId!;

      const [items, total] = await Promise.all([
        prisma.savedEvent.findMany({
          where: { userId },
          include: {
            event: {
              include: {
                organizer: { select: { id: true, displayName: true, avatarUrl: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.savedEvent.count({ where: { userId } }),
      ]);

      const formatted = items.map((s) => ({
        ...s,
        event: {
          ...s.event,
          tags: parseTags(s.event.tags),
          category: categoryFromDb(s.event.category),
        },
      }));

      res.json(paginate(formatted, total, { page, limit }));
    } catch (err) {
      next(err);
    }
  }
);

// --- Friends ---

// POST /api/users/friends/:userId
router.post(
  '/friends/:userId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const requesterId = req.userId!;
      const addresseeId = param(req, 'userId');

      if (requesterId === addresseeId) {
        throw new AppError(400, 'You cannot send a friend request to yourself.');
      }

      const addressee = await prisma.user.findUnique({ where: { id: addresseeId } });
      if (!addressee) throw new AppError(404, 'User not found.');

      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId, addresseeId },
            { requesterId: addresseeId, addresseeId: requesterId },
          ],
        },
      });

      if (existing) {
        if (existing.status === 'ACCEPTED') {
          throw new AppError(409, 'You are already friends.');
        }
        if (existing.status === 'PENDING') {
          throw new AppError(409, 'A friend request already exists.');
        }
        if (existing.status === 'DECLINED') {
          await prisma.friendship.update({
            where: { id: existing.id },
            data: { status: 'PENDING', requesterId, addresseeId },
          });
          const requester = await prisma.user.findUnique({
            where: { id: requesterId },
            select: { displayName: true },
          });
          await notifyFriendRequest(addresseeId, requester?.displayName || 'Someone');
          res.json({ message: 'Friend request sent.' });
          return;
        }
      }

      await prisma.friendship.create({
        data: { requesterId, addresseeId },
      });

      const requester = await prisma.user.findUnique({
        where: { id: requesterId },
        select: { displayName: true },
      });
      await notifyFriendRequest(addresseeId, requester?.displayName || 'Someone');

      res.status(201).json({ message: 'Friend request sent.' });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/users/friends/:userId
router.put(
  '/friends/:userId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.userId!;
      const otherUserId = param(req, 'userId');
      const { action } = req.body;

      if (!action || !['accept', 'decline'].includes(action)) {
        throw new AppError(400, 'Action must be "accept" or "decline".');
      }

      const friendship = await prisma.friendship.findFirst({
        where: {
          requesterId: otherUserId,
          addresseeId: currentUserId,
          status: 'PENDING',
        },
      });

      if (!friendship) {
        throw new AppError(404, 'No pending friend request from this user.');
      }

      const newStatus = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
      await prisma.friendship.update({
        where: { id: friendship.id },
        data: { status: newStatus },
      });

      res.json({ message: `Friend request ${action}ed.` });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/users/friends
router.get(
  '/friends',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = parsePagination(req.query as Record<string, unknown>);
      const userId = req.userId!;

      const where = {
        status: 'ACCEPTED' as const,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      };

      const [friendships, total] = await Promise.all([
        prisma.friendship.findMany({
          where,
          include: {
            requester: { select: { id: true, displayName: true, avatarUrl: true, bio: true } },
            addressee: { select: { id: true, displayName: true, avatarUrl: true, bio: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.friendship.count({ where }),
      ]);

      const friends = friendships.map((f) =>
        f.requesterId === userId ? f.addressee : f.requester
      );

      res.json(paginate(friends, total, { page, limit }));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/users/friends/going/:eventId
router.get(
  '/friends/going/:eventId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const eventId = param(req, 'eventId');

      const friendships = await prisma.friendship.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
        select: { requesterId: true, addresseeId: true },
      });
      const friendIds = friendships.map((f) =>
        f.requesterId === userId ? f.addresseeId : f.requesterId
      );

      if (friendIds.length === 0) {
        res.json({ friends: [] });
        return;
      }

      const bookings = await prisma.booking.findMany({
        where: {
          eventId,
          status: 'CONFIRMED',
          userId: { in: friendIds },
        },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      });

      res.json({ friends: bookings.map((b) => b.user) });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
