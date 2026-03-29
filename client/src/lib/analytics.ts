import type { AnalyticsEvent } from '../types';

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export function trackEvent(name: string, properties?: Record<string, string | number | boolean>): void {
  const event: AnalyticsEvent = { name, properties };
  if (isDev) {
    console.log('[Analytics] Event:', event.name, event.properties ?? '');
  }
  // In production, this would call Mixpanel/Amplitude/etc.
}

export function trackPageView(path: string, title: string): void {
  if (isDev) {
    console.log('[Analytics] PageView:', path, title);
  }
}

export function trackSearch(query: string, resultCount: number): void {
  trackEvent('search', { query, resultCount });
}

export function trackBooking(eventId: string, amount: number): void {
  trackEvent('booking', { eventId, amount });
}

export function trackShare(eventId: string, method: string): void {
  trackEvent('share', { eventId, method });
}
