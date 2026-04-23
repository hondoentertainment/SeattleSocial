import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { api } from '../utils/api';
import type { AppUser, RSVP, Notification } from '../utils/api';

interface AppState {
  user: AppUser | null;
  token: string | null;
  rsvpEventIds: Set<string>;
  waitlistEventIds: Set<string>;
  savedEventIds: Set<string>;
  notifications: Notification[];
  unreadCount: number;
  searchQuery: string;
  isAuthLoading: boolean;
}

interface AppActions {
  login: (token: string, user: AppUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setSearchQuery: (q: string) => void;
  rsvpToEvent: (eventId: string, ticketCount?: number) => Promise<{ waitlist: boolean; position?: number; isFirstEvent?: boolean; totalPaid?: number }>;
  cancelRsvp: (eventId: string) => Promise<void>;
  saveEvent: (eventId: string) => Promise<void>;
  unsaveEvent: (eventId: string) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  refreshRsvps: () => Promise<void>;
  pushNotification: (n: Notification) => void;
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ss_token'));
  const [rsvpEventIds, setRsvpEventIds] = useState<Set<string>>(new Set());
  const [waitlistEventIds, setWaitlistEventIds] = useState<Set<string>>(new Set());
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(
    () => new Set(JSON.parse(localStorage.getItem('ss_saved') || '[]'))
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(token));
  const esRef = useRef<EventSource | null>(null);

  const pushNotification = useCallback((n: Notification) => {
    setNotifications(prev => [n, ...prev]);
  }, []);

  const login = useCallback((newToken: string, newUser: AppUser) => {
    localStorage.setItem('ss_token', newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ss_token');
    esRef.current?.close();
    setToken(null);
    setUser(null);
    setRsvpEventIds(new Set());
    setWaitlistEventIds(new Set());
    setNotifications([]);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('ss_token')) return;
    try {
      const { user: u } = await api.auth.me();
      setUser(u);
    } catch {
      logout();
    }
  }, [logout]);

  const refreshRsvps = useCallback(async () => {
    if (!localStorage.getItem('ss_token')) return;
    try {
      const { rsvps } = await api.rsvps.list();
      setRsvpEventIds(new Set(rsvps.filter(r => r.status === 'confirmed').map(r => r.eventId)));
      setWaitlistEventIds(new Set(rsvps.filter(r => r.status === 'waitlist').map(r => r.eventId)));
    } catch { /* not authenticated */ }
  }, []);

  // Bootstrap auth on mount
  useEffect(() => {
    if (!token) { setIsAuthLoading(false); return; }
    (async () => {
      try {
        const [{ user: u }, { rsvps }, { savedEvents }, { notifications: notifs }] = await Promise.all([
          api.auth.me(),
          api.rsvps.list(),
          api.users.saved(),
          api.users.notifications()
        ]);
        setUser(u);
        setRsvpEventIds(new Set(rsvps.filter(r => r.status === 'confirmed').map(r => r.eventId)));
        setWaitlistEventIds(new Set(rsvps.filter(r => r.status === 'waitlist').map(r => r.eventId)));
        setSavedEventIds(new Set(savedEvents.map(e => e.id)));
        setNotifications(notifs);
      } catch {
        logout();
      } finally {
        setIsAuthLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // SSE connection — open when logged in, close on logout
  useEffect(() => {
    if (!token) { esRef.current?.close(); esRef.current = null; return; }

    const es = new EventSource(`/api/sse/stream?token=${encodeURIComponent(token)}`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'waitlist_promoted') {
          setWaitlistEventIds(prev => { const s = new Set(prev); s.delete(data.eventId); return s; });
          setRsvpEventIds(prev => new Set([...prev, data.eventId]));
          const n: Notification = {
            id: Date.now(), type: 'waitlist_promoted',
            title: "🎉 You're off the waitlist!",
            message: `A spot opened for ${data.title}! Your RSVP is confirmed.`,
            is_read: 0, created_at: new Date().toISOString()
          };
          pushNotification(n);
        }
      } catch { /* ignore malformed frames */ }
    };

    return () => { es.close(); esRef.current = null; };
  }, [token, pushNotification]);

  const rsvpToEvent = useCallback(async (eventId: string, ticketCount = 1) => {
    const result = await api.rsvps.create(eventId, ticketCount);
    if (result.waitlist) {
      setWaitlistEventIds(prev => new Set([...prev, eventId]));
    } else {
      setRsvpEventIds(prev => new Set([...prev, eventId]));
      if (user) setUser(u => u ? { ...u, events_attended: u.events_attended + 1 } : u);
    }
    return result;
  }, [user]);

  const cancelRsvp = useCallback(async (eventId: string) => {
    await api.rsvps.cancel(eventId);
    setRsvpEventIds(prev => { const s = new Set(prev); s.delete(eventId); return s; });
    setWaitlistEventIds(prev => { const s = new Set(prev); s.delete(eventId); return s; });
  }, []);

  const saveEvent = useCallback(async (eventId: string) => {
    if (!user) {
      const updated = new Set([...savedEventIds, eventId]);
      setSavedEventIds(updated);
      localStorage.setItem('ss_saved', JSON.stringify([...updated]));
      return;
    }
    await api.users.save(eventId);
    setSavedEventIds(prev => new Set([...prev, eventId]));
  }, [user, savedEventIds]);

  const unsaveEvent = useCallback(async (eventId: string) => {
    if (!user) {
      const updated = new Set(savedEventIds);
      updated.delete(eventId);
      setSavedEventIds(updated);
      localStorage.setItem('ss_saved', JSON.stringify([...updated]));
      return;
    }
    await api.users.unsave(eventId);
    setSavedEventIds(prev => { const s = new Set(prev); s.delete(eventId); return s; });
  }, [user, savedEventIds]);

  const markNotificationsRead = useCallback(async () => {
    if (user) await api.users.markRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppContext.Provider value={{
      user, token, rsvpEventIds, waitlistEventIds, savedEventIds,
      notifications, unreadCount, searchQuery, isAuthLoading,
      login, logout, refreshUser, setSearchQuery,
      rsvpToEvent, cancelRsvp, saveEvent, unsaveEvent,
      markNotificationsRead, refreshRsvps, pushNotification
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
