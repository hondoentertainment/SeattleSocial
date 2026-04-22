export interface Event {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  organizerName: string;
  venue: Venue;
  startTime: string;
  endTime: string;
  category: EventCategory;
  price: number;
  capacity: number;
  ticketsSold: number;
  fomoScore: number;
  imageUrl: string;
  videoUrl?: string;
  tags: string[];
  attendees: number;
  friendsGoing: number;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  location: {
    lat: number;
    lng: number;
  };
}

export type EventCategory =
  | 'music'
  | 'food-drink'
  | 'arts-culture'
  | 'sports-fitness'
  | 'networking'
  | 'learning'
  | 'nightlife'
  | 'community';

export interface User {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  neighborhood: string;
  bio?: string;
  interests: EventCategory[];
  membershipTier: 'free' | 'premium' | 'premium-plus';
  eventsAttended: number;
}

export interface RSVP {
  id: string;
  userId: string;
  eventId: string;
  status: 'confirmed' | 'cancelled' | 'waitlist';
  ticketCount: number;
  totalPaid: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'rsvp_confirmed' | 'event_reminder' | 'fomo_alert' | 'promo';
  title: string;
  message: string;
  eventId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface FOMOIndexBreakdown {
  fillRate: number;
  timePressure: number;
  socialProof: number;
  friendFactor: number;
  total: number;
}

export interface Filters {
  categories: EventCategory[];
  dateRange: 'today' | 'week' | 'month' | 'custom' | 'all';
  priceRange: [number, number];
  neighborhoods: string[];
  fomoThreshold: number;
  sortBy: 'fomo' | 'date' | 'price-asc' | 'price-desc';
  freeOnly: boolean;
}
