import { describe, it, expect } from 'vitest';
import { generateICSContent } from '../../utils/calendar';
import type { Event } from '../../types';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'evt-1',
    title: 'Test Event',
    description: 'A fun test event',
    organizerId: 'org-1',
    organizerName: 'Test Org',
    venue: {
      id: 'v-1',
      name: 'Test Venue',
      address: '123 Main St',
      neighborhood: 'Capitol Hill',
      location: { lat: 47.6, lng: -122.3 },
    },
    startTime: '2026-06-15T19:00:00Z',
    endTime: '2026-06-15T22:00:00Z',
    category: 'music',
    price: 25,
    capacity: 100,
    ticketsSold: 50,
    fomoScore: 75,
    imageUrl: 'https://example.com/image.jpg',
    tags: ['live-music', 'outdoor'],
    attendees: 50,
    friendsGoing: 3,
    ...overrides,
  };
}

describe('generateICSContent', () => {
  it('creates valid ICS format with BEGIN:VCALENDAR and END:VCALENDAR', () => {
    const content = generateICSContent(makeEvent());
    expect(content).toContain('BEGIN:VCALENDAR');
    expect(content).toContain('END:VCALENDAR');
  });

  it('contains required ICS fields', () => {
    const content = generateICSContent(makeEvent());
    expect(content).toContain('VERSION:2.0');
    expect(content).toContain('BEGIN:VEVENT');
    expect(content).toContain('END:VEVENT');
    expect(content).toContain('DTSTART:');
    expect(content).toContain('DTEND:');
    expect(content).toContain('DTSTAMP:');
    expect(content).toContain('UID:');
    expect(content).toContain('SUMMARY:');
    expect(content).toContain('DESCRIPTION:');
    expect(content).toContain('LOCATION:');
  });

  it('properly formats dates in ICS format (YYYYMMDDTHHMMSSZ)', () => {
    const content = generateICSContent(makeEvent({
      startTime: '2026-06-15T19:00:00Z',
      endTime: '2026-06-15T22:00:00Z',
    }));
    expect(content).toContain('DTSTART:20260615T190000Z');
    expect(content).toContain('DTEND:20260615T220000Z');
  });

  it('includes event title in SUMMARY', () => {
    const content = generateICSContent(makeEvent({ title: 'Summer Concert' }));
    expect(content).toContain('SUMMARY:Summer Concert');
  });

  it('includes UID with event id', () => {
    const content = generateICSContent(makeEvent({ id: 'my-event-123' }));
    expect(content).toContain('UID:my-event-123@seattlesocial.app');
  });

  it('escapes special characters in description', () => {
    const content = generateICSContent(makeEvent({
      description: 'Line1\nLine2; with semicolons, and commas',
    }));
    expect(content).toContain('DESCRIPTION:Line1\\nLine2\\; with semicolons\\, and commas');
  });

  it('includes venue location', () => {
    const content = generateICSContent(makeEvent({
      venue: {
        id: 'v-1',
        name: 'The Showbox',
        address: '1426 1st Ave',
        neighborhood: 'Downtown',
        location: { lat: 47.6, lng: -122.3 },
      },
    }));
    expect(content).toContain('LOCATION:The Showbox');
    expect(content).toContain('1426 1st Ave');
    expect(content).toContain('Downtown');
  });

  it('uses CRLF line endings', () => {
    const content = generateICSContent(makeEvent());
    expect(content).toContain('\r\n');
    // The content should be joined with \r\n
    const lines = content.split('\r\n');
    expect(lines.length).toBeGreaterThan(5);
  });
});
