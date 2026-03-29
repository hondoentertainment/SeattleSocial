import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBookings,
  addBooking,
  cancelBooking,
  getBookingForEvent,
  getSavedEvents,
  saveEvent,
  unsaveEvent,
  getMembershipTier,
  setMembershipTier,
} from '../../utils/storage';

// Simple localStorage mock for Node/jsdom
beforeEach(() => {
  localStorage.clear();
});

function makeBooking(overrides: Partial<{
  id: string;
  eventId: string;
  userId: string;
  ticketCount: number;
  totalPrice: number;
  status: 'confirmed' | 'cancelled' | 'pending' | 'waitlisted';
  bookedAt: string;
}> = {}) {
  return {
    id: 'booking-1',
    eventId: 'event-1',
    userId: 'user-1',
    ticketCount: 1,
    totalPrice: 25,
    status: 'confirmed' as const,
    bookedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('getBookings', () => {
  it('returns empty array when no bookings stored', () => {
    expect(getBookings()).toEqual([]);
  });

  it('returns stored bookings', () => {
    const booking = makeBooking();
    addBooking(booking);
    expect(getBookings()).toEqual([booking]);
  });
});

describe('addBooking', () => {
  it('stores booking correctly', () => {
    const booking = makeBooking({ id: 'b-1', eventId: 'e-1' });
    addBooking(booking);

    const bookings = getBookings();
    expect(bookings).toHaveLength(1);
    expect(bookings[0].id).toBe('b-1');
    expect(bookings[0].eventId).toBe('e-1');
  });

  it('appends to existing bookings', () => {
    addBooking(makeBooking({ id: 'b-1' }));
    addBooking(makeBooking({ id: 'b-2' }));

    expect(getBookings()).toHaveLength(2);
  });
});

describe('cancelBooking', () => {
  it('updates booking status to cancelled', () => {
    addBooking(makeBooking({ id: 'b-1', status: 'confirmed' }));
    cancelBooking('b-1');

    const bookings = getBookings();
    expect(bookings[0].status).toBe('cancelled');
  });

  it('does not affect other bookings', () => {
    addBooking(makeBooking({ id: 'b-1' }));
    addBooking(makeBooking({ id: 'b-2' }));
    cancelBooking('b-1');

    const bookings = getBookings();
    expect(bookings.find(b => b.id === 'b-2')!.status).toBe('confirmed');
  });
});

describe('getBookingForEvent', () => {
  it('returns correct confirmed booking for event', () => {
    addBooking(makeBooking({ id: 'b-1', eventId: 'e-1', status: 'confirmed' }));
    addBooking(makeBooking({ id: 'b-2', eventId: 'e-2', status: 'confirmed' }));

    const result = getBookingForEvent('e-1');
    expect(result).toBeDefined();
    expect(result!.id).toBe('b-1');
  });

  it('returns undefined for cancelled bookings', () => {
    addBooking(makeBooking({ id: 'b-1', eventId: 'e-1', status: 'cancelled' }));
    expect(getBookingForEvent('e-1')).toBeUndefined();
  });

  it('returns undefined when no booking exists', () => {
    expect(getBookingForEvent('nonexistent')).toBeUndefined();
  });
});

describe('getSavedEvents / saveEvent / unsaveEvent', () => {
  it('returns empty array when no saved events', () => {
    expect(getSavedEvents()).toEqual([]);
  });

  it('saveEvent stores event id', () => {
    saveEvent('e-1');
    expect(getSavedEvents()).toEqual(['e-1']);
  });

  it('saveEvent does not duplicate', () => {
    saveEvent('e-1');
    saveEvent('e-1');
    expect(getSavedEvents()).toEqual(['e-1']);
  });

  it('unsaveEvent removes event id', () => {
    saveEvent('e-1');
    saveEvent('e-2');
    unsaveEvent('e-1');
    expect(getSavedEvents()).toEqual(['e-2']);
  });
});

describe('getMembershipTier / setMembershipTier', () => {
  it('returns free by default', () => {
    expect(getMembershipTier()).toBe('free');
  });

  it('setMembershipTier stores and retrieves premium', () => {
    setMembershipTier('premium');
    expect(getMembershipTier()).toBe('premium');
  });

  it('setMembershipTier stores and retrieves premium-plus', () => {
    setMembershipTier('premium-plus');
    expect(getMembershipTier()).toBe('premium-plus');
  });
});
