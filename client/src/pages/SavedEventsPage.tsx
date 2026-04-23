import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MapPin, Calendar, X, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import type { SavedEvent } from '../utils/api';
import AuthModal from '../components/AuthModal';
import { getFOMOColor, getFOMOLabel } from '../utils/fomoIndex';

export default function SavedEventsPage() {
  const { user, savedEventIds, unsaveEvent } = useApp();
  const [saved, setSaved] = useState<SavedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.users.saved()
      .then(({ savedEvents }) => setSaved(savedEvents))
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load saved events'))
      .finally(() => setLoading(false));
  }, [user]);

  // Keep local list in sync when context unsaves (e.g. from another page)
  useEffect(() => {
    setSaved(prev => prev.filter(e => savedEventIds.has(e.id)));
  }, [savedEventIds]);

  const handleUnsave = async (eventId: string) => {
    setRemoving(eventId);
    try {
      await unsaveEvent(eventId);
      setSaved(prev => prev.filter(e => e.id !== eventId));
    } catch { /* context already handles optimistic update */ }
    finally { setRemoving(null); }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (s: string) =>
    new Date(s).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        <div className="text-center max-w-md">
          <Bookmark className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Saved Events</h1>
          <p className="text-gray-600 mb-6">Sign in to see the events you've bookmarked.</p>
          <button onClick={() => setShowAuth(true)} className="btn-primary px-8">Sign In</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center space-x-3 mb-8">
          <Bookmark className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saved Events</h1>
            <p className="text-gray-500">{saved.length} event{saved.length !== 1 ? 's' : ''} bookmarked</p>
          </div>
        </div>

        {loadError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
            {loadError}
          </div>
        )}

        {saved.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="text-5xl mb-4">🔖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No saved events yet</h3>
            <p className="text-gray-600 mb-6">Bookmark events you're interested in and they'll appear here.</p>
            <Link to="/" className="btn-primary inline-flex items-center space-x-2">
              <ArrowRight className="w-4 h-4" />
              <span>Browse Events</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {saved.map(event => {
              const fomoColor = getFOMOColor(event.fomoScore);
              const fomoLabel = getFOMOLabel(event.fomoScore);
              return (
                <div key={event.id} className="bg-white rounded-xl shadow-md overflow-hidden flex">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4 flex items-center justify-between min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link
                          to={`/events/${event.id}`}
                          className="font-bold text-gray-900 hover:text-primary-600 line-clamp-1 text-base"
                        >
                          {event.title}
                        </Link>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{formatDate(event.startTime)} at {formatTime(event.startTime)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="line-clamp-1">{event.venueName}, {event.venueNeighborhood}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <span className={`${fomoColor} text-white text-xs px-2 py-0.5 rounded-full font-semibold`}>
                          {fomoLabel}
                        </span>
                        <span className="text-xs text-gray-500">
                          {event.price === 0 ? 'Free' : `$${event.price}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                      <Link
                        to={`/events/${event.id}`}
                        className="btn-primary py-2 px-4 text-sm whitespace-nowrap"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleUnsave(event.id)}
                        disabled={removing === event.id}
                        aria-label={`Remove ${event.title} from saved events`}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
