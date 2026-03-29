import { PrismaClient } from '@prisma/client';
import { NotificationType } from '../types';

const prisma = new PrismaClient();

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  eventId?: string;
}

/**
 * Create a notification for a user.
 */
export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      eventId: input.eventId || null,
    },
  });
}

/**
 * Notify a user that their booking is confirmed.
 */
export async function notifyBookingConfirmed(userId: string, eventTitle: string, eventId: string) {
  return createNotification({
    userId,
    type: 'BOOKING_CONFIRMED',
    title: 'Booking Confirmed!',
    message: `Your booking for "${eventTitle}" has been confirmed.`,
    eventId,
  });
}

/**
 * Notify friends of a user that they RSVPed to an event.
 */
export async function notifyFriendsOfRsvp(
  userId: string,
  userDisplayName: string,
  eventTitle: string,
  eventId: string,
  friendIds: string[]
) {
  const notifications = friendIds.map((friendId) => ({
    userId: friendId,
    type: 'FRIEND_RSVP' as const,
    title: 'Friend is Going!',
    message: `${userDisplayName} just RSVP'd to "${eventTitle}".`,
    eventId,
    isRead: false,
  }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }
}

/**
 * Notify a user that someone sent them a friend request.
 */
export async function notifyFriendRequest(targetUserId: string, requesterName: string) {
  return createNotification({
    userId: targetUserId,
    type: 'FRIEND_REQUEST',
    title: 'New Friend Request',
    message: `${requesterName} sent you a friend request.`,
  });
}

/**
 * Notify a user of a FOMO spike on an event they saved or might be interested in.
 */
export async function notifyFomoSpike(userId: string, eventTitle: string, eventId: string, fomoScore: number) {
  return createNotification({
    userId,
    type: 'FOMO_SPIKE',
    title: 'FOMO Alert!',
    message: `"${eventTitle}" is trending with a FOMO score of ${fomoScore}! Don't miss out.`,
    eventId,
  });
}
