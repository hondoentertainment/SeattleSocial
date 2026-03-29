import { describe, it, expect } from 'vitest';
import { calculateFomoScore } from '../../services/fomo';

function makeEvent(overrides: Partial<{
  capacity: number;
  startTime: Date;
  endTime: Date;
  price: number;
  category: string;
  createdAt: Date;
}> = {}) {
  const now = new Date();
  return {
    capacity: 100,
    startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24h from now
    endTime: new Date(now.getTime() + 26 * 60 * 60 * 1000),
    price: 25,
    category: 'MUSIC',
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    ...overrides,
  };
}

function makeBookings(overrides: Partial<{
  totalConfirmed: number;
  recentBookings24h: number;
  categoryAveragePrice: number;
}> = {}) {
  return {
    totalConfirmed: 0,
    recentBookings24h: 0,
    categoryAveragePrice: 25,
    ...overrides,
  };
}

describe('calculateFomoScore', () => {
  it('returns score between 0 and 100', () => {
    const result = calculateFomoScore(makeEvent(), makeBookings(), 0);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it('returns higher score when event is nearly sold out', () => {
    const event = makeEvent();
    const lowBookings = makeBookings({ totalConfirmed: 10 });
    const highBookings = makeBookings({ totalConfirmed: 95 });

    const lowResult = calculateFomoScore(event, lowBookings, 0);
    const highResult = calculateFomoScore(event, highBookings, 0);

    expect(highResult.total).toBeGreaterThan(lowResult.total);
    expect(highResult.capacityPressure).toBeGreaterThan(lowResult.capacityPressure);
  });

  it('returns higher score when event is very soon', () => {
    const now = new Date();
    const soonEvent = makeEvent({
      startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour
    });
    const farEvent = makeEvent({
      startTime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    const soonResult = calculateFomoScore(soonEvent, makeBookings(), 0);
    const farResult = calculateFomoScore(farEvent, makeBookings(), 0);

    expect(soonResult.timeUrgency).toBeGreaterThan(farResult.timeUrgency);
    expect(soonResult.total).toBeGreaterThan(farResult.total);
  });

  it('returns correct breakdown with all 6 components', () => {
    const result = calculateFomoScore(makeEvent(), makeBookings({ totalConfirmed: 50 }), 2);

    expect(result).toHaveProperty('ticketVelocity');
    expect(result).toHaveProperty('socialProof');
    expect(result).toHaveProperty('timeUrgency');
    expect(result).toHaveProperty('priceDemand');
    expect(result).toHaveProperty('trendingScore');
    expect(result).toHaveProperty('capacityPressure');
    expect(result).toHaveProperty('total');

    // Each component should be a number between 0 and 100
    for (const key of ['ticketVelocity', 'socialProof', 'timeUrgency', 'priceDemand', 'trendingScore', 'capacityPressure'] as const) {
      expect(result[key]).toBeGreaterThanOrEqual(0);
      expect(result[key]).toBeLessThanOrEqual(100);
    }
  });

  it('returns 0 for event far in the future with no bookings', () => {
    const now = new Date();
    const farEvent = makeEvent({
      startTime: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year away
      createdAt: new Date(now.getTime() - 1000), // just created
    });

    const result = calculateFomoScore(farEvent, makeBookings(), 0);

    // With no bookings, no friends, and far-away event, score should be very low
    expect(result.total).toBeLessThan(5);
    expect(result.ticketVelocity).toBe(0);
    expect(result.socialProof).toBe(0);
    expect(result.capacityPressure).toBe(0);
    expect(result.trendingScore).toBe(0);
  });

  it('weights each component correctly', () => {
    // Verify the total is a weighted sum of components
    const result = calculateFomoScore(
      makeEvent(),
      makeBookings({ totalConfirmed: 50, recentBookings24h: 5 }),
      3,
    );

    const expectedTotal =
      result.ticketVelocity * 0.25 +
      result.socialProof * 0.20 +
      result.timeUrgency * 0.20 +
      result.priceDemand * 0.15 +
      result.trendingScore * 0.10 +
      result.capacityPressure * 0.10;

    // Allow for rounding differences since each component is rounded
    expect(result.total).toBeCloseTo(Math.round(expectedTotal * 10) / 10, 0);
  });
});
