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
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
  membershipTier: MembershipTier;
  membershipExpiresAt?: string | null;
  createdAt?: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  displayName: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface CheckoutSession {
  clientSecret: string;
  paymentId: string;
  amount: number;
  mock: boolean;
}

export interface MembershipCheckoutResponse {
  sessionUrl: string;
  mock: boolean;
  message: string;
}

// FOMO types
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

// Filter types
export type DateFilter = 'any' | 'today' | 'this-weekend' | 'this-week' | 'this-month';
export type PriceFilter = 'any' | 'free' | 'under-25' | 'under-50';
export type SortOption = 'fomo' | 'date' | 'price-low' | 'price-high';

// Booking types
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';

export interface Booking {
  id: string;
  eventId: string;
  userId: string;
  ticketCount: number;
  totalPaid: number;
  status: BookingStatus;
  createdAt: string;
  event?: Event;
}

// Membership types
export type MembershipTier = 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';

export interface PricingPlan {
  tier: MembershipTier;
  name: string;
  price: number;
  features: string[];
  highlighted?: boolean;
}

// Social / Friend types
export interface SocialUser {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  /** Client-side only fields for mock/display purposes */
  neighborhood?: string;
  membershipTier?: MembershipTier;
  mutualFriends?: number;
  lastEventTogether?: string;
  eventsAttended?: number;
}

export type FriendStatus = 'friends' | 'pending-outgoing' | 'pending-incoming' | 'none';

export interface FriendRequest {
  id: string;
  from: SocialUser;
  to: SocialUser;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}

export interface FriendsGoingData {
  eventId: string;
  friends: SocialUser[];
}

export interface MockUser {
  id: string;
  displayName: string;
  bio: string;
  avatar: string;
  memberSince: string;
  membershipTier: MembershipTier;
  eventsAttended: number;
  friendsCount: number;
  neighborhood: string;
  interests: EventCategory[];
}

export interface Friend {
  id: string;
  displayName: string;
  avatar: string;
  mutualEvents: number;
}

// Notification types
export type NotificationType =
  | 'fomo-spike'
  | 'friend-rsvp'
  | 'event-reminder'
  | 'booking-confirmed'
  | 'price-drop'
  | 'friend-request';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  eventId?: string;
  userId?: string;
  icon?: string;
}

export type AppNotification = Notification;

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

// Analytics types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}
