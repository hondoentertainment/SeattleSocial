import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest, AppError, param } from '../types';
import { parsePagination, paginate, generateSlug, categoryToDb, categoryFromDb, parseTags } from '../utils/helpers';
import { calculateFomoScore } from '../services/fomo';

const router = Router();
const prisma = new PrismaClient();

/**
 * Compute FOMO score for an event with its bookings context.
 */
async function computeFomoForEvent(event: {
  id: string;
  capacity: number;
  startTime: Date;
  endTime: Date;
  price: number;
  category: string;
  createdAt: Date;
}, friendsGoing: number = 0) {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [totalConfirmed, recentBookings24h, categoryEvents] = await Promise.all([
    prisma.booking.count({
      where: { eventId: event.id, status: 'CONFIRMED' },
    }),
    prisma.booking.count({
      where: {
        eventId: event.id,
        status: 'CONFIRMED',
        createdAt: { gte: twentyFourHoursAgo },
      },
    }),
    prisma.event.findMany({
      where: { category: event.category },
      select: { price: true },
    }),
  ]);

  const categoryAveragePrice =
    categoryEvents.length > 0
      ? categoryEvents.reduce((sum, e) => sum + e.price, 0) / categoryEvents.length
      : event.price;

  return calculateFomoScore(
    event,
    { totalConfirmed, recentBookings24h, categoryAveragePrice },
    friendsGoing
  );
}

/**
 * Format an event for the API response (includes computed fields).
 */
async function formatEvent(event: Record<string, unknown> & {
  id: string;
  tags: string;
  category: string;
  capacity: number;
  startTime: Date;
  endTime: Date;
  price: number;
  createdAt: Date;
  organizer?: { id: string; displayName: string; avatarUrl: string | null };
}, userId?: string) {
  const totalConfirmed = await prisma.booking.count({
    where: { eventId: event.id, status: 'CONFIRMED' },
  });

  let friendsGoing = 0;
  if (userId) {
    const friendIds = await getAcceptedFriendIds(userId);
    if (friendIds.length > 0) {
      friendsGoing = await prisma.booking.count({
        where: {
          eventId: event.id,
          status: 'CONFIRMED',
          userId: { in: friendIds },
        },
      });
    }
  }

  const fomo = await computeFomoForEvent(event, friendsGoing);

  return {
    ...event,
    tags: parseTags(event.tags),
    category: categoryFromDb(event.category),
    attendees: totalConfirmed,
    friendsGoing,
    fomoScore: fomo.total,
    fomoBreakdown: fomo,
    ticketsSold: totalConfirmed,
  };
}

async function getAcceptedFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  return friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId
  );
}

/**
 * Try to extract userId from an optional Bearer token.
 */
function optionalUserId(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
  try {
    const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
    const { config } = require('../config') as typeof import('../config');
    const decoded = jwt.verify(authHeader.split(' ')[1], config.jwtSecret) as { userId: string };
    return decoded.userId;
  } catch {
    return undefined;
  }
}

// GET /api/events
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const {
      category,
      neighborhood,
      minPrice,
      maxPrice,
      search,
      dateFrom,
      dateTo,
      sortBy,
    } = req.query;

    const userId = optionalUserId(req);

    const where: Prisma.EventWhereInput = { isPublished: true };

    if (category && typeof category === 'string') {
      where.category = categoryToDb(category);
    }
    if (neighborhood && typeof neighborhood === 'string') {
      where.venueNeighborhood = { contains: neighborhood };
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Prisma.FloatFilter).gte = parseFloat(String(minPrice));
      if (maxPrice) (where.price as Prisma.FloatFilter).lte = parseFloat(String(maxPrice));
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { venueName: { contains: search } },
        { tags: { contains: search } },
      ];
    }
    if (dateFrom && typeof dateFrom === 'string') {
      where.startTime = { ...(where.startTime as object || {}), gte: new Date(dateFrom) };
    }
    if (dateTo && typeof dateTo === 'string') {
      where.startTime = { ...(where.startTime as object || {}), lte: new Date(dateTo) };
    }

    let orderBy: Prisma.EventOrderByWithRelationInput = { startTime: 'asc' };
    if (sortBy === 'price') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'date') {
      orderBy = { startTime: 'asc' };
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { organizer: { select: { id: true, displayName: true, avatarUrl: true } } },
      }),
      prisma.event.count({ where }),
    ]);

    const formatted = await Promise.all(
      events.map((e) => formatEvent(e as Parameters<typeof formatEvent>[0], userId))
    );

    if (sortBy === 'fomoScore') {
      formatted.sort((a, b) => b.fomoScore - a.fomoScore);
    }

    res.json(paginate(formatted, total, { page, limit }));
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = param(req, 'id');
    const event = await prisma.event.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: { organizer: { select: { id: true, displayName: true, avatarUrl: true } } },
    });

    if (!event) {
      throw new AppError(404, 'Event not found.');
    }

    const userId = optionalUserId(req);
    const formatted = await formatEvent(event as Parameters<typeof formatEvent>[0], userId);
    res.json({ event: formatted });
  } catch (err) {
    next(err);
  }
});

// POST /api/events
router.post(
  '/',
  authenticate,
  validate({
    title: { required: true, type: 'string', minLength: 3, maxLength: 200 },
    description: { required: true, type: 'string', minLength: 10 },
    venueName: { required: true, type: 'string' },
    venueAddress: { required: true, type: 'string' },
    venueNeighborhood: { required: true, type: 'string' },
    startTime: { required: true, type: 'string' },
    endTime: { required: true, type: 'string' },
    category: { required: true, type: 'string' },
    capacity: { required: true, type: 'number', min: 1 },
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {
        title, description, venueName, venueAddress, venueNeighborhood,
        venueLat, venueLng, startTime, endTime, category, price,
        capacity, imageUrl, videoUrl, tags, isPublished,
      } = req.body;

      const slug = generateSlug(title);

      const event = await prisma.event.create({
        data: {
          title,
          slug,
          description,
          organizerId: req.userId!,
          venueName,
          venueAddress,
          venueNeighborhood,
          venueLat: venueLat || 0,
          venueLng: venueLng || 0,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          category: categoryToDb(category),
          price: price || 0,
          capacity,
          imageUrl: imageUrl || null,
          videoUrl: videoUrl || null,
          tags: JSON.stringify(tags || []),
          isPublished: isPublished !== undefined ? isPublished : true,
        },
        include: { organizer: { select: { id: true, displayName: true, avatarUrl: true } } },
      });

      const formatted = await formatEvent(event as Parameters<typeof formatEvent>[0], req.userId);
      res.status(201).json({ event: formatted });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/events/:id
router.put(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const eventId = param(req, 'id');
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) {
        throw new AppError(404, 'Event not found.');
      }
      if (event.organizerId !== req.userId) {
        throw new AppError(403, 'You can only edit your own events.');
      }

      const {
        title, description, venueName, venueAddress, venueNeighborhood,
        venueLat, venueLng, startTime, endTime, category, price,
        capacity, imageUrl, videoUrl, tags, isPublished,
      } = req.body;

      const data: Prisma.EventUpdateInput = {};
      if (title !== undefined) { data.title = title; data.slug = generateSlug(title); }
      if (description !== undefined) data.description = description;
      if (venueName !== undefined) data.venueName = venueName;
      if (venueAddress !== undefined) data.venueAddress = venueAddress;
      if (venueNeighborhood !== undefined) data.venueNeighborhood = venueNeighborhood;
      if (venueLat !== undefined) data.venueLat = venueLat;
      if (venueLng !== undefined) data.venueLng = venueLng;
      if (startTime !== undefined) data.startTime = new Date(startTime);
      if (endTime !== undefined) data.endTime = new Date(endTime);
      if (category !== undefined) data.category = categoryToDb(category);
      if (price !== undefined) data.price = price;
      if (capacity !== undefined) data.capacity = capacity;
      if (imageUrl !== undefined) data.imageUrl = imageUrl;
      if (videoUrl !== undefined) data.videoUrl = videoUrl;
      if (tags !== undefined) data.tags = JSON.stringify(tags);
      if (isPublished !== undefined) data.isPublished = isPublished;

      const updated = await prisma.event.update({
        where: { id: eventId },
        data,
        include: { organizer: { select: { id: true, displayName: true, avatarUrl: true } } },
      });

      const formatted = await formatEvent(updated as Parameters<typeof formatEvent>[0], req.userId);
      res.json({ event: formatted });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/events/:id
router.delete(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const eventId = param(req, 'id');
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) {
        throw new AppError(404, 'Event not found.');
      }
      if (event.organizerId !== req.userId) {
        throw new AppError(403, 'You can only delete your own events.');
      }

      await prisma.$transaction([
        prisma.notification.deleteMany({ where: { eventId } }),
        prisma.savedEvent.deleteMany({ where: { eventId } }),
        prisma.booking.deleteMany({ where: { eventId } }),
        prisma.event.delete({ where: { id: eventId } }),
      ]);

      res.json({ message: 'Event deleted.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
