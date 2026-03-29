import type { Booking, MembershipTier } from '../types';

const BOOKINGS_KEY = 'seattlesocial_bookings';
const SAVED_EVENTS_KEY = 'seattlesocial_saved_events';
const MEMBERSHIP_KEY = 'seattlesocial_membership';

// --- Bookings ---

export function getBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    return raw ? (JSON.parse(raw) as Booking[]) : [];
  } catch {
    return [];
  }
}

export function addBooking(booking: Booking): void {
  const bookings = getBookings();
  bookings.push(booking);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

export function cancelBooking(bookingId: string): void {
  const bookings = getBookings();
  const updated = bookings.map(b =>
    b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
  );
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
}

export function getBookingForEvent(eventId: string): Booking | undefined {
  return getBookings().find(
    b => b.eventId === eventId && b.status === 'confirmed'
  );
}

// --- Saved Events ---

export function getSavedEvents(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_EVENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveEvent(eventId: string): void {
  const saved = getSavedEvents();
  if (!saved.includes(eventId)) {
    saved.push(eventId);
    localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(saved));
  }
}

export function unsaveEvent(eventId: string): void {
  const saved = getSavedEvents().filter(id => id !== eventId);
  localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(saved));
}

// --- Membership ---

export function getMembershipTier(): MembershipTier {
  try {
    const raw = localStorage.getItem(MEMBERSHIP_KEY);
    if (raw === 'premium' || raw === 'premium-plus') return raw;
    return 'free';
  } catch {
    return 'free';
  }
}

export function setMembershipTier(tier: MembershipTier): void {
  localStorage.setItem(MEMBERSHIP_KEY, tier);
}
