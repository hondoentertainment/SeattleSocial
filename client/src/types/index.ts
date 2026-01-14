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
  interests: EventCategory[];
  membershipTier: 'free' | 'premium' | 'premium-plus';
  eventsAttended: number;
}

export interface FOMOIndexBreakdown {
  ticketVelocity: number;
  socialBuzz: number;
  attendeeDiversity: number;
  venueScore: number;
  influencerFactor: number;
  historicalScore: number;
}

export interface Filters {
  categories: EventCategory[];
  dateRange: 'today' | 'week' | 'month' | 'custom';
  priceRange: [number, number];
  neighborhoods: string[];
  fomoThreshold: number;
}
