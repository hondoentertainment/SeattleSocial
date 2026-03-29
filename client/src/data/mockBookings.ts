import type { Booking } from '../types';
import { getBookings, addBooking } from '../utils/storage';

const SEED_KEY = 'seattlesocial_bookings_seeded';

const sampleBookings: Booking[] = [
  {
    id: 'bk-1',
    eventId: '1',
    userId: 'user-1',
    ticketCount: 2,
    totalPaid: 50,
    status: 'CONFIRMED',
    createdAt: '2026-01-10T14:30:00',
  },
  {
    id: 'bk-2',
    eventId: '3',
    userId: 'user-1',
    ticketCount: 1,
    totalPaid: 0,
    status: 'CONFIRMED',
    createdAt: '2026-01-12T09:15:00',
  },
  {
    id: 'bk-3',
    eventId: '5',
    userId: 'user-1',
    ticketCount: 1,
    totalPaid: 15,
    status: 'CANCELLED',
    createdAt: '2026-01-08T18:00:00',
  },
  {
    id: 'bk-4',
    eventId: '7',
    userId: 'user-1',
    ticketCount: 4,
    totalPaid: 0,
    status: 'CONFIRMED',
    createdAt: '2026-01-05T20:00:00',
  },
  {
    id: 'bk-5',
    eventId: '9',
    userId: 'user-1',
    ticketCount: 2,
    totalPaid: 60,
    status: 'CONFIRMED',
    createdAt: '2026-01-14T11:00:00',
  },
];

export function seedBookings(): void {
  if (localStorage.getItem(SEED_KEY)) return;
  const existing = getBookings();
  if (existing.length === 0) {
    sampleBookings.forEach(b => addBooking(b));
  }
  localStorage.setItem(SEED_KEY, 'true');
}
