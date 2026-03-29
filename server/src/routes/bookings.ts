import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest, AppError, param } from '../types';
import { parsePagination, paginate, categoryFromDb, parseTags } from '../utils/helpers';
import { notifyBookingConfirmed, notifyFriendsOfRsvp } from '../services/notifications';

const router = Router();
const prisma = new PrismaClient();

// POST /api/bookings
router.post(
  '/',
  authenticate,
  validate({
    eventId: { required: true, type: 'string' },
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { eventId, ticketCount = 1 } = req.body;
      const userId = req.userId!;

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) {
        throw new AppError(404, 'Event not found.');
      }

      const existingBooking = await prisma.booking.findUnique({
        where: { userId_eventId: { userId, eventId } },
      });
      if (existingBooking && existingBooking.status === 'CONFIRMED') {
        throw new AppError(409, 'You already have a booking for this event.');
      }

      const confirmedCount = await prisma.booking.count({
        where: { eventId, status: 'CONFIRMED' },
      });

      const requestedTickets = Math.max(1, Math.min(ticketCount, 10));
      const remainingCapacity = event.capacity - confirmedCount;

      let status = 'CONFIRMED';
      if (remainingCapacity <= 0) {
        status = 'WAITLISTED';
      } else if (requestedTickets > remainingCapacity) {
        throw new AppError(400, `Only ${remainingCapacity} ticket(s) remaining.`);
      }

      const totalPaid = event.price * requestedTickets;

      const booking = existingBooking
        ? await prisma.booking.update({
            where: { id: existingBooking.id },
            data: { status, ticketCount: requestedTickets, totalPaid },
            include: { event: true },
          })
        : await prisma.booking.create({
            data: {
              userId,
              eventId,
              status,
              ticketCount: requestedTickets,
              totalPaid,
            },
            include: { event: true },
          });

      if (status === 'CONFIRMED') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { displayName: true },
        });

        await notifyBookingConfirmed(userId, event.title, eventId);

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
        if (friendIds.length > 0 && user) {
          await notifyFriendsOfRsvp(userId, user.displayName, event.title, eventId, friendIds);
        }
      }

      res.status(201).json({ booking });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/bookings
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = parsePagination(req.query as Record<string, unknown>);
      const userId = req.userId!;

      const where = { userId, status: { not: 'CANCELLED' } };

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
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
        prisma.booking.count({ where }),
      ]);

      const formatted = bookings.map((b) => ({
        ...b,
        event: {
          ...b.event,
          tags: parseTags(b.event.tags),
          category: categoryFromDb(b.event.category),
        },
      }));

      res.json(paginate(formatted, total, { page, limit }));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/bookings/:id
router.delete(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const bookingId = param(req, 'id');
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new AppError(404, 'Booking not found.');
      }
      if (booking.userId !== req.userId) {
        throw new AppError(403, 'You can only cancel your own bookings.');
      }
      if (booking.status === 'CANCELLED') {
        throw new AppError(400, 'Booking is already cancelled.');
      }

      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
        include: { event: true },
      });

      res.json({ booking: updated, message: 'Booking cancelled.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
