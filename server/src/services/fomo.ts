import { FomoBreakdown } from '../types';

interface FomoEventInput {
  capacity: number;
  startTime: Date;
  endTime: Date;
  price: number;
  category: string;
  createdAt: Date;
}

interface FomoBookingsInput {
  totalConfirmed: number;
  recentBookings24h: number;
  categoryAveragePrice: number;
}

/**
 * Calculate the FOMO Index for an event on a 0-100 scale.
 *
 * Components:
 *   ticketVelocity (25%)   - % tickets sold relative to time elapsed since event creation
 *   socialProof (20%)      - friends going + total attendee ratio
 *   timeUrgency (20%)      - how soon the event is (closer = higher)
 *   priceDemand (15%)      - price position relative to category average
 *   trendingScore (10%)    - recent booking velocity in last 24 hours
 *   capacityPressure (10%) - how full the event is (% of capacity)
 */
export function calculateFomoScore(
  event: FomoEventInput,
  bookings: FomoBookingsInput,
  friendsGoing: number
): FomoBreakdown {
  const now = new Date();

  // --- Ticket Velocity (0-100) ---
  // How fast are tickets selling relative to time available?
  const totalTimeMs = event.startTime.getTime() - event.createdAt.getTime();
  const elapsedTimeMs = now.getTime() - event.createdAt.getTime();
  const timeRatio = totalTimeMs > 0 ? Math.min(elapsedTimeMs / totalTimeMs, 1) : 1;
  const soldRatio = event.capacity > 0 ? bookings.totalConfirmed / event.capacity : 0;

  let ticketVelocity: number;
  if (timeRatio <= 0) {
    ticketVelocity = soldRatio * 100;
  } else {
    // If sold ratio is ahead of time ratio, velocity is high
    const velocityRatio = soldRatio / timeRatio;
    ticketVelocity = clamp(velocityRatio * 50, 0, 100);
  }

  // --- Social Proof (0-100) ---
  // Combination of friends going and overall popularity
  const friendsScore = Math.min(friendsGoing * 15, 60); // Each friend adds 15, max 60
  const attendeePopularity = event.capacity > 0
    ? (bookings.totalConfirmed / event.capacity) * 40
    : 0;
  const socialProof = clamp(friendsScore + attendeePopularity, 0, 100);

  // --- Time Urgency (0-100) ---
  // Events happening sooner score higher; past events score 0
  const msUntilEvent = event.startTime.getTime() - now.getTime();
  if (msUntilEvent < 0) {
    // Event already started or passed
    const timeUrgency = 0;
    const priceDemand = calculatePriceDemand(event.price, bookings.categoryAveragePrice, soldRatio);
    const trendingScore = calculateTrending(bookings.recentBookings24h, event.capacity);
    const capacityPressure = clamp(soldRatio * 100, 0, 100);

    const total =
      ticketVelocity * 0.25 +
      socialProof * 0.20 +
      timeUrgency * 0.20 +
      priceDemand * 0.15 +
      trendingScore * 0.10 +
      capacityPressure * 0.10;

    return {
      ticketVelocity: round(ticketVelocity),
      socialProof: round(socialProof),
      timeUrgency: round(timeUrgency),
      priceDemand: round(priceDemand),
      trendingScore: round(trendingScore),
      capacityPressure: round(capacityPressure),
      total: round(total),
    };
  }

  const hoursUntil = msUntilEvent / (1000 * 60 * 60);
  let timeUrgency: number;
  if (hoursUntil <= 2) {
    timeUrgency = 100;
  } else if (hoursUntil <= 24) {
    timeUrgency = 90 - (hoursUntil - 2) * (40 / 22); // 90 down to ~50
  } else if (hoursUntil <= 72) {
    timeUrgency = 50 - (hoursUntil - 24) * (25 / 48); // 50 down to ~25
  } else if (hoursUntil <= 168) {
    timeUrgency = 25 - (hoursUntil - 72) * (15 / 96); // 25 down to ~10
  } else {
    timeUrgency = Math.max(10 - (hoursUntil - 168) * 0.01, 0);
  }

  // --- Price Demand (0-100) ---
  const priceDemand = calculatePriceDemand(event.price, bookings.categoryAveragePrice, soldRatio);

  // --- Trending Score (0-100) ---
  const trendingScore = calculateTrending(bookings.recentBookings24h, event.capacity);

  // --- Capacity Pressure (0-100) ---
  const capacityPressure = clamp(soldRatio * 100, 0, 100);

  // --- Total ---
  const total =
    ticketVelocity * 0.25 +
    socialProof * 0.20 +
    timeUrgency * 0.20 +
    priceDemand * 0.15 +
    trendingScore * 0.10 +
    capacityPressure * 0.10;

  return {
    ticketVelocity: round(ticketVelocity),
    socialProof: round(socialProof),
    timeUrgency: round(timeUrgency),
    priceDemand: round(priceDemand),
    trendingScore: round(trendingScore),
    capacityPressure: round(capacityPressure),
    total: round(total),
  };
}

/**
 * Price demand: free events with high demand score well;
 * paid events priced below category average with high demand also score well.
 */
function calculatePriceDemand(price: number, categoryAvg: number, soldRatio: number): number {
  if (price === 0) {
    // Free events: demand is purely based on how full they are
    return clamp(soldRatio * 100, 0, 100);
  }
  if (categoryAvg <= 0) {
    return 50;
  }
  // Lower price relative to avg + higher sold ratio = higher demand score
  const priceRatio = price / categoryAvg;
  const priceComponent = priceRatio < 1 ? (1 - priceRatio) * 60 : Math.max(30 - (priceRatio - 1) * 30, 0);
  const demandComponent = soldRatio * 40;
  return clamp(priceComponent + demandComponent, 0, 100);
}

/**
 * Trending: how many bookings happened in the last 24 hours relative to capacity.
 */
function calculateTrending(recentBookings: number, capacity: number): number {
  if (capacity <= 0) return 0;
  const recentRatio = recentBookings / capacity;
  // If 10% of capacity booked in last 24h, that's very trending
  return clamp(recentRatio * 1000, 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
