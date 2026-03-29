import type {
  User,
  Event,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Booking,
  Notification,
  CheckoutSession,
  MembershipCheckoutResponse,
} from '../types';
import { mockEvents } from '../data/mockEvents';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'seattlesocial_token';
const DEMO_USER_KEY = 'seattlesocial_demo_user';
const DEMO_MODE_KEY = 'seattlesocial_demo_mode';

let isDemoMode = false;
let csrfToken: string | null = null;

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

function createDemoUser(email: string, displayName: string): User {
  return {
    id: 'demo-' + Date.now(),
    displayName,
    email,
    membershipTier: 'FREE',
  };
}

/**
 * Fetch a CSRF token from the server.
 * Called on app init and refreshed on 403 CSRF errors.
 */
async function fetchCsrfToken(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/auth/csrf-token`, {
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrfToken;
    }
  } catch {
    // Server unavailable -- CSRF token will be null (demo mode)
  }
}

// Fetch CSRF token on module load
fetchCsrfToken();

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && token !== 'demo-token') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Include CSRF token on state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Handle CSRF token failure -- refresh and retry once
    if (response.status === 403) {
      const body = await response.json().catch(() => ({}));
      if (body?.error?.code === 'CSRF_ERROR') {
        await fetchCsrfToken();
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken;
        }
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        });
        if (!retryResponse.ok) {
          const retryError = await retryResponse.json().catch(() => ({
            message: 'An error occurred',
          }));
          throw new Error(retryError.message || `HTTP ${retryResponse.status}`);
        }
        const retryText = await retryResponse.text();
        return retryText ? JSON.parse(retryText) : ({} as T);
      }
      throw new Error(body.message || body?.error?.message || `HTTP 403`);
    }

    if (response.status === 401) {
      clearToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || error.error?.message || `HTTP ${response.status}`);
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

/**
 * Retry wrapper for GET requests with exponential backoff.
 * Only retries on network errors (TypeError / fetch failures), not on 4xx/5xx.
 */
async function requestWithRetry<T>(
  endpoint: string,
  options?: RequestInit,
  maxRetries = 3
): Promise<T> {
  let lastError: Error = new Error('Request failed');
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await request<T>(endpoint, options);
    } catch (err) {
      lastError = err as Error;
      // Only retry on network errors, not HTTP errors
      if (
        err instanceof TypeError ||
        (err instanceof Error && err.message === 'BACKEND_UNAVAILABLE')
      ) {
        // Reset demo mode flag so next attempt can try again
        if (attempt < maxRetries - 1) {
          isDemoMode = false;
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
          continue;
        }
      }
      throw err; // Don't retry auth or validation errors
    }
  }
  throw lastError;
}

// ---- Auth ----

export async function loginUser(
  credentials: LoginRequest
): Promise<AuthResponse> {
  try {
    const response = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return { token: response.token, user: response.user };
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
    const response = await request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { token: response.token, user: response.user };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'BACKEND_UNAVAILABLE'
    ) {
      const user = createDemoUser(data.email, data.displayName);
      setDemoUser(user);
      setToken('demo-token');
      return { token: 'demo-token', user };
    }
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await request<void>('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore errors -- clear local state regardless
  }
  clearToken();
}

export async function getCurrentUser(): Promise<User> {
  try {
    // Server wraps user in { user: ... }
    const response = await requestWithRetry<{ user: User }>('/auth/me');
    return response.user;
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

// ---- Password Reset ----

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

// ---- Events ----

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function getEvents(): Promise<Event[]> {
  try {
    // Server returns paginated response: { data: [...], pagination: {...} }
    const response = await requestWithRetry<PaginatedResponse<Event>>('/events');
    return response.data;
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
    // Server wraps event in { event: ... }
    const response = await requestWithRetry<{ event: Event }>(`/events/${id}`);
    return response.event;
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

export async function createBooking(eventId: string, ticketCount: number = 1): Promise<Booking> {
  // Server returns { booking: ... }
  const response = await request<{ booking: Booking }>('/bookings', {
    method: 'POST',
    body: JSON.stringify({ eventId, ticketCount }),
  });
  return response.booking;
}

export async function cancelBooking(bookingId: string): Promise<void> {
  await request<{ booking: Booking; message: string }>(`/bookings/${bookingId}`, {
    method: 'DELETE',
  });
}

export async function getUserBookings(): Promise<Booking[]> {
  // Server returns paginated response at GET /api/bookings (not /bookings/me)
  const response = await requestWithRetry<PaginatedResponse<Booking>>('/bookings');
  return response.data;
}

// ---- Saved Events ----

export async function saveEvent(eventId: string): Promise<void> {
  // Server endpoint: POST /api/users/saved-events/:eventId
  await request<{ savedEvent: unknown }>(`/users/saved-events/${eventId}`, {
    method: 'POST',
  });
}

export async function unsaveEvent(eventId: string): Promise<void> {
  // Server endpoint: DELETE /api/users/saved-events/:eventId
  await request<{ message: string }>(`/users/saved-events/${eventId}`, {
    method: 'DELETE',
  });
}

export async function getSavedEvents(): Promise<Event[]> {
  // Server endpoint: GET /api/users/saved-events (returns paginated saved events with nested event)
  const response = await requestWithRetry<PaginatedResponse<{ event: Event }>>('/users/saved-events');
  return response.data.map((item) => item.event);
}

// ---- Friends ----

export async function sendFriendRequest(userId: string): Promise<{ message: string }> {
  // Server endpoint: POST /api/users/friends/:userId
  return request<{ message: string }>(`/users/friends/${userId}`, {
    method: 'POST',
  });
}

export async function respondToFriendRequest(
  userId: string,
  action: 'accept' | 'decline'
): Promise<{ message: string }> {
  // Server endpoint: PUT /api/users/friends/:userId with { action: 'accept' | 'decline' }
  return request<{ message: string }>(`/users/friends/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ action }),
  });
}

export async function getFriends(): Promise<User[]> {
  // Server endpoint: GET /api/users/friends (returns paginated list)
  const response = await requestWithRetry<PaginatedResponse<User>>('/users/friends');
  return response.data;
}

export async function getFriendsGoing(eventId: string): Promise<User[]> {
  // Server endpoint: GET /api/users/friends/going/:eventId
  const response = await requestWithRetry<{ friends: User[] }>(`/users/friends/going/${eventId}`);
  return response.friends;
}

// ---- Notifications ----

export async function getNotifications(): Promise<Notification[]> {
  // Server returns paginated response
  const response = await requestWithRetry<PaginatedResponse<Notification>>('/notifications');
  return response.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await request<{ message: string }>(`/notifications/${id}/read`, {
    method: 'PUT',
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await request<{ message: string }>('/notifications/read-all', {
    method: 'PUT',
  });
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return requestWithRetry<{ count: number }>('/notifications/unread-count');
}

// ---- Profile ----

export async function updateProfile(
  data: Partial<Pick<User, 'displayName' | 'avatarUrl' | 'bio'>>
): Promise<User> {
  // Server returns { user: ... }
  const response = await request<{ user: User }>('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.user;
}

export async function getProfile(): Promise<{ user: User; stats: { eventsAttended: number; eventsOrganized: number; friendsCount: number; savedCount: number } }> {
  return requestWithRetry<{ user: User; stats: { eventsAttended: number; eventsOrganized: number; friendsCount: number; savedCount: number } }>('/users/profile');
}

// ---- Payments ----

export async function createCheckout(
  eventId: string,
  ticketCount: number = 1
): Promise<CheckoutSession> {
  // Server endpoint: POST /api/payments/checkout with { eventId, ticketCount }
  return request<CheckoutSession>('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ eventId, ticketCount }),
  });
}

export async function upgradeMembership(
  tier: string
): Promise<MembershipCheckoutResponse> {
  // Server endpoint: POST /api/payments/membership with { tier }
  return request<MembershipCheckoutResponse>('/payments/membership', {
    method: 'POST',
    body: JSON.stringify({ tier }),
  });
}
