import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Trash2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import type { RSVP } from '../utils/api';
import AuthModal from '../components/AuthModal';

export default function CalendarPage() {
  const { user, cancelRsvp, refreshRsvps } = useApp();
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.rsvps.list()
      .then(({ rsvps: r }) => setRsvps(r))
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load events'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleCancel = async (eventId: string) => {
    if (!confirm('Cancel your RSVP for this event?')) return;
    setCancelling(eventId);
    try {
      await cancelRsvp(eventId);
      setRsvps(prev => prev.filter(r => r.eventId !== eventId));
      refreshRsvps();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to cancel RSVP');
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (s: string) =>
    new Date(s).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const upcoming = rsvps.filter(r => new Date(r.event.startTime) >= new Date());
  const past = rsvps.filter(r => new Date(r.event.startTime) < new Date());

  const categoryEmoji: Record<string, string> = {
    'music': '🎵', 'food-drink': '🍽️', 'arts-culture': '🎨',
    'sports-fitness': '⚽', 'networking': '🤝', 'nightlife': '🌙',
    'learning': '📚', 'community': '🏘️'
  };

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        <div className="text-center max-w-md">
          <Calendar className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">My Events Calendar</h1>
          <p className="text-gray-600 mb-6">Sign in to see your upcoming events and RSVPs in one place.</p>
          <button onClick={() => setShowAuth(true)} className="btn-primary px-8">Sign In</button>
          <p className="mt-4 text-sm text-gray-500">
            Don't have an account?{' '}
            <button onClick={() => setShowAuth(true)} className="text-primary-600 font-semibold">Sign up free</button>
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center space-x-3 mb-8">
          <Calendar className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
            <p className="text-gray-500">{upcoming.length} upcoming · {past.length} attended</p>
          </div>
        </div>

        {loadError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
            {loadError}
          </div>
        )}

        {rsvps.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="text-5xl mb-4">🎟️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No events yet!</h3>
            <p className="text-gray-600 mb-6">Find something you love and reserve your spot.</p>
            <Link to="/" className="btn-primary">Browse Events</Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <ArrowRight className="w-5 h-5 text-primary-600" />
                  <span>Upcoming ({upcoming.length})</span>
                </h2>
                <div className="space-y-4">
                  {upcoming.map(rsvp => (
                    <RSVPCard
                      key={rsvp.id}
                      rsvp={rsvp}
                      emoji={categoryEmoji[rsvp.event.category] || '🎯'}
                      onCancel={() => handleCancel(rsvp.eventId)}
                      cancelling={cancelling === rsvp.eventId}
                      formatDate={formatDate}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-500 mb-4">Past Events ({past.length})</h2>
                <div className="space-y-4 opacity-70">
                  {past.map(rsvp => (
                    <RSVPCard
                      key={rsvp.id}
                      rsvp={rsvp}
                      emoji={categoryEmoji[rsvp.event.category] || '🎯'}
                      past
                      formatDate={formatDate}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface RSVPCardProps {
  rsvp: RSVP;
  emoji: string;
  past?: boolean;
  onCancel?: () => void;
  cancelling?: boolean;
  formatDate: (s: string) => string;
  formatTime: (s: string) => string;
}

function RSVPCard({ rsvp, emoji, past, onCancel, cancelling, formatDate, formatTime }: RSVPCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex">
      <div className="w-24 h-24 flex-shrink-0 relative">
        <img src={rsvp.event.imageUrl} alt={rsvp.event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-2xl">{emoji}</div>
      </div>
      <div className="flex-1 p-4 flex items-center justify-between">
        <div>
          <Link to={`/events/${rsvp.eventId}`} className="font-bold text-gray-900 hover:text-primary-600 line-clamp-1">
            {rsvp.event.title}
          </Link>
          <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDate(rsvp.event.startTime)} at {formatTime(rsvp.event.startTime)}</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{rsvp.event.venueName}, {rsvp.event.venueNeighborhood}</span>
          </div>
          <div className="mt-1">
            {rsvp.totalPaid === 0 ? (
              <span className="text-xs font-semibold text-green-600">FREE</span>
            ) : (
              <span className="text-xs font-semibold text-gray-700">${rsvp.totalPaid} paid</span>
            )}
            <span className="text-xs text-gray-400 ml-2">• {rsvp.ticketCount} ticket{rsvp.ticketCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {!past && onCancel && (
          <button onClick={onCancel} disabled={cancelling}
            className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Cancel RSVP">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
        {past && (
          <span className="ml-4 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Attended</span>
        )}
      </div>
    </div>
  );
}
