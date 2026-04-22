import type { Event } from '../types';

export interface FOMOBreakdown {
  fillRate: number;
  timePressure: number;
  socialProof: number;
  friendFactor: number;
  total: number;
}

export function calculateFOMOScore(event: Event): FOMOBreakdown {
  // Fill rate: how full is the event (0-40 points)
  const fillRate = Math.min(40, Math.round((event.ticketsSold / event.capacity) * 40));

  // Time pressure: urgency based on hours until event (0-25 points)
  const hoursUntil = (new Date(event.startTime).getTime() - Date.now()) / 3600000;
  let timePressure = 0;
  if (hoursUntil <= 0) {
    timePressure = 0; // already started
  } else if (hoursUntil <= 24) {
    timePressure = 25; // within 24 hours — maximum urgency
  } else if (hoursUntil <= 72) {
    timePressure = 18; // within 3 days
  } else if (hoursUntil <= 168) {
    timePressure = 10; // within a week
  } else {
    timePressure = 5;
  }

  // Social proof: attendee count relative to venue capacity (0-20 points)
  const socialProof = Math.min(20, Math.round((event.attendees / Math.max(event.capacity, 1)) * 20));

  // Friend factor: known friends going (0-15 points)
  const friendFactor = Math.min(15, event.friendsGoing * 3);

  const total = Math.min(100, fillRate + timePressure + socialProof + friendFactor);

  return { fillRate, timePressure, socialProof, friendFactor, total };
}

export function getFOMOLabel(score: number): string {
  if (score >= 90) return 'Selling out NOW';
  if (score >= 80) return 'Selling out fast!';
  if (score >= 65) return 'High demand — book soon';
  if (score >= 50) return 'Popular event';
  if (score >= 35) return 'Growing interest';
  return 'Just announced';
}

export function getFOMOColor(score: number): string {
  if (score >= 80) return 'bg-red-500';
  if (score >= 65) return 'bg-orange-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-blue-500';
}

export function getFOMOBadgeClass(score: number): string {
  if (score >= 80) return 'fomo-badge-extreme';
  if (score >= 65) return 'fomo-badge-high';
  if (score >= 50) return 'fomo-badge-moderate';
  return 'fomo-badge-low';
}

export function getFlameCount(score: number): number {
  if (score >= 80) return 3;
  if (score >= 65) return 2;
  if (score >= 50) return 1;
  return 0;
}
