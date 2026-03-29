import type {
  User,
  Event,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Booking,
  Notification,
  FriendRequest,
  CheckoutSession,
} from '../types';
import { mockEvents } from '../data/mockEvents';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'seattlesocial_token';
const DEMO_USER_KEY = 'seattlesocial_demo_user';
const DEMO_MODE_KEY = 'seattlesocial_demo_mode';

let isDemoMode = false;

export function getIsDemoMode(): boolean {
  return isDemoMode;
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(DEMO_USER_KEY);
}

function getDemoUser(): User | null {
  const stored = localStorage.getItem(DEMO_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }
  return null;
}

function setDemoUser(user: User): void {
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
}

function createDemoUser(email: string, name: string): User {
  return {
    id: 'demo-' + Date.now(),
    name,
    email,
    neighborhood: 'Capitol Hill',
    interests: ['music', 'food-drink'],
    membershipTier: 'free',
    eventsAttended: 0,
  };
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && token !== 'demo-token') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      clearToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error - backend unavailable, switch to demo mode
      isDemoMode = true;
      localStorage.setItem(DEMO_MODE_KEY, 'true');
      throw new Error('BACKEND_UNAVAILABLE');
    }
    throw error;
  }
}

// ---- Auth ----

export async function loginUser(
  credentials: LoginRequest
): Promise<AuthResponse> {
  try {
    return await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'BACKEND_UNAVAILABLE'
    ) {
      // Demo mode login
      const user = createDemoUser(credentials.email, credentials.email.split('@')[0]);
      setDemoUser(user);
      setToken('demo-token');
      return { token: 'demo-token', user };
    }
    throw error;
  }
}

export async function registerUser(
  data: RegisterRequest
): Promise<AuthResponse> {
  try {
    return await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'BACKEND_UNAVAILABLE'
    ) {
      const user = createDemoUser(data.email, data.name);
      setDemoUser(user);
      setToken('demo-token');
      return { token: 'demo-token', user };
    }
    throw error;
  }
}

export async function getCurrentUser(): Promise<User> {
  try {
    return await request<User>('/auth/me');
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'BACKEND_UNAVAILABLE'
    ) {
      const demoUser = getDemoUser();
      if (demoUser) {
        return demoUser;
      }
      throw new Error('Not authenticated');
    }
    throw error;
  }
}

// ---- Events ----

export async function getEvents(): Promise<Event[]> {
  try {
    return await request<Event[]>('/events');
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'BACKEND_UNAVAILABLE'
    ) {
      return mockEvents;
    }
    throw error;
  }
}

export async function getEvent(id: string): Promise<Event> {
  try {
    return await request<Event>(`/events/${id}`);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'BACKEND_UNAVAILABLE'
    ) {
      const event = mockEvents.find((e) => e.id === id);
      if (event) return event;
      throw new Error('Event not found');
    }
    throw error;
  }
}

// ---- Bookings ----

export async function createBooking(eventId: string): Promise<Booking> {
  return request<Booking>('/bookings', {
    method: 'POST',
    body: JSON.stringify({ eventId }),
  });
}

export async function cancelBooking(bookingId: string): Promise<void> {
  return request<void>(`/bookings/${bookingId}`, {
    method: 'DELETE',
  });
}

export async function getUserBookings(): Promise<Booking[]> {
  return request<Booking[]>('/bookings/me');
}

// ---- Saved Events ----

export async function saveEvent(eventId: string): Promise<void> {
  return request<void>(`/events/${eventId}/save`, {
    method: 'POST',
  });
}

export async function unsaveEvent(eventId: string): Promise<void> {
  return request<void>(`/events/${eventId}/save`, {
    method: 'DELETE',
  });
}

export async function getSavedEvents(): Promise<Event[]> {
  return request<Event[]>('/events/saved');
}

// ---- Friends ----

export async function sendFriendRequest(userId: string): Promise<FriendRequest> {
  return request<FriendRequest>('/friends/request', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function respondToFriendRequest(
  requestId: string,
  status: 'accepted' | 'rejected'
): Promise<FriendRequest> {
  return request<FriendRequest>(`/friends/request/${requestId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function getFriends(): Promise<User[]> {
  return request<User[]>('/friends');
}

export async function getFriendsGoing(eventId: string): Promise<User[]> {
  return request<User[]>(`/events/${eventId}/friends`);
}

// ---- Notifications ----

export async function getNotifications(): Promise<Notification[]> {
  return request<Notification[]>('/notifications');
}

export async function markNotificationRead(id: string): Promise<void> {
  return request<void>(`/notifications/${id}/read`, {
    method: 'PUT',
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  return request<void>('/notifications/read-all', {
    method: 'PUT',
  });
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return request<{ count: number }>('/notifications/unread-count');
}

// ---- Profile ----

export async function updateProfile(
  data: Partial<User>
): Promise<User> {
  return request<User>('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ---- Payments ----

export async function createCheckout(
  tier: string
): Promise<CheckoutSession> {
  return request<CheckoutSession>('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ tier }),
  });
}

export async function upgradeMembership(
  tier: string
): Promise<User> {
  return request<User>('/payments/upgrade', {
    method: 'POST',
    body: JSON.stringify({ tier }),
  });
}
