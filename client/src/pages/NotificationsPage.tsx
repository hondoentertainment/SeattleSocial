import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BellOff,
  Flame,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  CheckCheck,
} from 'lucide-react';
import { mockNotifications } from '../data/mockNotifications';
import type { Notification } from '../types';

const iconMap: Record<string, typeof Flame> = {
  flame: Flame,
  users: Users,
  clock: Clock,
  'check-circle': CheckCircle,
  'trending-up': TrendingUp,
  'alert-circle': AlertCircle,
};

const typeColorMap: Record<string, string> = {
  'fomo-spike': 'bg-red-100 text-red-600',
  'friend-rsvp': 'bg-primary-100 text-primary-600',
  'event-reminder': 'bg-yellow-100 text-yellow-600',
  'booking-confirmed': 'bg-green-100 text-green-600',
  'price-drop': 'bg-blue-100 text-blue-600',
  'friend-request': 'bg-purple-100 text-purple-600',
};

function groupNotifications(notifications: Notification[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const today: Notification[] = [];
  const thisWeek: Notification[] = [];
  const earlier: Notification[] = [];

  notifications.forEach(n => {
    const d = new Date(n.timestamp);
    if (d >= todayStart) {
      today.push(n);
    } else if (d >= weekAgo) {
      thisWeek.push(n);
    } else {
      earlier.push(n);
    }
  });

  return { today, thisWeek, earlier };
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const groups = useMemo(() => groupNotifications(notifications), [notifications]);

  const renderGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
          {title}
        </h3>
        <div className="space-y-2">
          {items.map(notification => {
            const Icon = iconMap[notification.icon || ''] || Bell;
            return (
              <div
                key={notification.id}
                onClick={() => toggleRead(notification.id)}
                className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                  notification.read
                    ? 'bg-white hover:bg-gray-50'
                    : 'bg-primary-50 hover:bg-primary-100 border-l-4 border-primary-500'
                }`}
              >
                <div className={`p-2.5 rounded-full flex-shrink-0 ${typeColorMap[notification.type] || 'bg-gray-100 text-gray-600'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-sm ${notification.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                  {notification.eventId && (
                    <Link
                      to={`/events/${notification.eventId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      View Event &rarr;
                    </Link>
                  )}
                </div>
                {!notification.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const isEmpty = notifications.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">{unreadCount} unread</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {isEmpty ? (
          <div className="text-center py-20">
            <BellOff className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No notifications</h2>
            <p className="text-gray-500">
              You're all caught up! We'll notify you when something interesting happens.
            </p>
          </div>
        ) : (
          <div>
            {renderGroup('Today', groups.today)}
            {renderGroup('This Week', groups.thisWeek)}
            {renderGroup('Earlier', groups.earlier)}
          </div>
        )}
      </div>
    </div>
  );
}
