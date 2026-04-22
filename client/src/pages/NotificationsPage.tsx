import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Calendar, Zap, Gift } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Notification } from '../utils/api';
import AuthModal from '../components/AuthModal';
import { useState } from 'react';

const ICONS: Record<string, React.ReactNode> = {
  rsvp_confirmed: <Calendar className="w-5 h-5 text-green-500" />,
  event_reminder: <Bell className="w-5 h-5 text-blue-500" />,
  fomo_alert: <Zap className="w-5 h-5 text-orange-500" />,
  promo: <Gift className="w-5 h-5 text-purple-500" />
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const { user, notifications, unreadCount, markNotificationsRead } = useApp();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (user && unreadCount > 0) {
      const t = setTimeout(() => markNotificationsRead(), 1500);
      return () => clearTimeout(t);
    }
  }, [user, unreadCount, markNotificationsRead]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        <div className="text-center max-w-md">
          <Bell className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Notifications</h1>
          <p className="text-gray-600 mb-6">Sign in to receive event reminders, RSVP confirmations, and FOMO alerts.</p>
          <button onClick={() => setShowAuth(true)} className="btn-primary px-8">Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-primary-600 font-medium">{unreadCount} unread</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={() => markNotificationsRead()}
              className="flex items-center space-x-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors">
              <CheckCheck className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="text-5xl mb-4">🔔</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600 mb-6">RSVP to events to start getting reminders and updates.</p>
            <Link to="/" className="btn-primary">Browse Events</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: Notification) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notification: n }: { notification: Notification }) {
  const icon = ICONS[n.type] || <Bell className="w-5 h-5 text-gray-400" />;

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-colors ${
      !n.is_read ? 'border-primary-200 bg-primary-50/30' : 'border-transparent'
    }`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5 p-2 bg-gray-100 rounded-full">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
            <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(n.created_at)}</span>
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
          {n.event_id && (
            <Link to={`/events/${n.event_id}`}
              className="text-xs text-primary-600 hover:underline mt-1 inline-block font-medium">
              View event →
            </Link>
          )}
        </div>
        {!n.is_read && (
          <div className="flex-shrink-0 w-2.5 h-2.5 bg-primary-500 rounded-full mt-2" />
        )}
      </div>
    </div>
  );
}
