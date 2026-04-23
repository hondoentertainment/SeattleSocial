const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('ss_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string; neighborhood?: string }) =>
      request<{ token: string; user: AppUser }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request<{ token: string; user: AppUser }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request<{ user: AppUser }>('/auth/me'),
    setPassword: (body: { password: string; currentPassword?: string }) =>
      request<{ message: string }>('/auth/set-password', { method: 'POST', body: JSON.stringify(body) }),
    sendMagicLink: (email: string) =>
      request<{ message: string; demoUrl?: string }>('/auth/magic-link/send', { method: 'POST', body: JSON.stringify({ email }) }),
    verifyMagicLink: (token: string) =>
      request<{ token: string; user: AppUser; isNewUser: boolean }>(`/auth/magic-link/verify?token=${encodeURIComponent(token)}`)
  },
  events: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ events: import('../types').Event[] }>(`/events${qs}`);
    },
    get: (id: string) => request<{ event: import('../types').Event }>(`/events/${id}`),
    neighborhoods: () => request<{ neighborhoods: string[] }>('/events/neighborhoods')
  },
  rsvps: {
    list: () => request<{ rsvps: RSVP[] }>('/rsvps'),
    create: (eventId: string, ticketCount = 1) =>
      request<{ waitlist: boolean; position?: number; message?: string; isFirstEvent?: boolean; totalPaid?: number }>('/rsvps', {
        method: 'POST', body: JSON.stringify({ eventId, ticketCount })
      }),
    cancel: (eventId: string) => request<{ message: string }>(`/rsvps/${eventId}`, { method: 'DELETE' }),
    waitlistPosition: (eventId: string) =>
      request<{ onWaitlist: boolean; position?: number }>(`/rsvps/waitlist/${eventId}`)
  },
  users: {
    saved: () => request<{ savedEvents: SavedEvent[] }>('/users/saved'),
    save: (eventId: string) => request<{ saved: boolean }>(`/users/saved/${eventId}`, { method: 'POST' }),
    unsave: (eventId: string) => request<{ saved: boolean }>(`/users/saved/${eventId}`, { method: 'DELETE' }),
    notifications: () => request<{ notifications: Notification[] }>('/users/notifications'),
    markRead: () => request<{ message: string }>('/users/notifications/read', { method: 'POST' }),
    updateProfile: (body: Partial<AppUser>) => request<{ user: AppUser }>('/users/profile', { method: 'PUT', body: JSON.stringify(body) })
  },
  organizer: {
    events: () => request<{ events: OrganizerEvent[] }>('/organizer/events'),
    stats: () => request<{ stats: OrganizerStats }>('/organizer/stats'),
    create: (body: CreateEventPayload) =>
      request<{ event: OrganizerEvent }>('/organizer/events', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CreateEventPayload & { isPublished: boolean; premiumOnly: boolean }>) =>
      request<{ event: OrganizerEvent }>(`/organizer/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<{ message: string }>(`/organizer/events/${id}`, { method: 'DELETE' })
  },
  payments: {
    checkout: (tier: string) =>
      request<{ checkoutUrl?: string; mockCheckout?: boolean; tier: string; plan: { price: number; name: string } }>('/payments/create-checkout', {
        method: 'POST', body: JSON.stringify({ tier })
      })
  },
  friends: {
    list: () => request<{ friends: FriendUser[]; incoming: FriendRequest[]; outgoing: FriendRequest[] }>('/friends'),
    search: (q: string) => request<{ users: FriendUser[] }>(`/friends/search?q=${encodeURIComponent(q)}`),
    request: (userId: number) => request<{ message: string }>(`/friends/request/${userId}`, { method: 'POST' }),
    accept: (requesterId: number) => request<{ message: string }>(`/friends/accept/${requesterId}`, { method: 'POST' }),
    remove: (userId: number) => request<{ message: string }>(`/friends/${userId}`, { method: 'DELETE' }),
    forEvent: (eventId: string) => request<{ friends: FriendUser[] }>(`/friends/event/${eventId}`)
  }
};

// ── Types ──────────────────────────────────────────────────────────────────

export interface AppUser {
  id: number;
  name: string;
  email: string;
  neighborhood: string;
  bio: string;
  profile_photo: string;
  membership_tier: 'free' | 'premium' | 'premium-plus';
  events_attended: number;
  interests: string[];
  hasPassword?: boolean;
}

export interface RSVP {
  id: number;
  eventId: string;
  status: string;
  ticketCount: number;
  totalPaid: number;
  createdAt: string;
  event: {
    id: string; title: string; startTime: string; endTime: string;
    imageUrl: string; venueName: string; venueNeighborhood: string;
    category: string; price: number;
  };
}

export interface SavedEvent {
  id: string; title: string; startTime: string; endTime: string;
  imageUrl: string; venueName: string; venueNeighborhood: string;
  category: string; price: number; fomoScore: number;
}

export interface Notification {
  id: number; type: string; title: string; message: string;
  event_id?: string; is_read: number; created_at: string;
}

export interface OrganizerEvent {
  id: string; title: string; description: string; category: string;
  startTime: string; endTime: string;
  venueName: string; venueAddress: string; venueNeighborhood: string;
  price: number; capacity: number; ticketsSold: number;
  attendees: number; fomoScore: number; isPublished: boolean;
  imageUrl: string; premiumOnly: boolean; tags: string[];
}

export interface OrganizerStats {
  totalEvents: number; totalAttendees: number; totalRevenue: number; upcomingEvents: number;
}

export interface CreateEventPayload {
  title: string; description: string; venueName: string; venueAddress: string;
  venueNeighborhood: string; startTime: string; endTime: string;
  category: string; price: number; capacity: number; imageUrl: string; tags: string[];
  premiumOnly?: boolean;
}

export interface FriendUser {
  id: number; name: string; email: string; neighborhood: string; profile_photo: string;
}

export interface FriendRequest extends FriendUser {
  request_id: number;
}
