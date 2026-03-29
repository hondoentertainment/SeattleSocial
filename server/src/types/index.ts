import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Safely extract a route parameter as a string.
 * Express 5 types params as string | string[]; this normalizes to string.
 */
export function param(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

export type MembershipTier = 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';

export type EventCategory =
  | 'MUSIC'
  | 'FOOD_DRINK'
  | 'ARTS_CULTURE'
  | 'SPORTS_FITNESS'
  | 'NETWORKING'
  | 'LEARNING'
  | 'NIGHTLIFE'
  | 'COMMUNITY';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export type NotificationType =
  | 'FOMO_SPIKE'
  | 'FRIEND_RSVP'
  | 'EVENT_REMINDER'
  | 'BOOKING_CONFIRMED'
  | 'PRICE_DROP'
  | 'FRIEND_REQUEST';

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

export type PaymentType = 'EVENT_BOOKING' | 'MEMBERSHIP_UPGRADE';

export interface FomoBreakdown {
  ticketVelocity: number;
  socialProof: number;
  timeUrgency: number;
  priceDemand: number;
  trendingScore: number;
  capacityPressure: number;
  total: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
