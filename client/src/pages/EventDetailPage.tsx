import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { MapPin, Calendar, Users, Flame, Share2, Bookmark, BookmarkCheck, TrendingUp, ArrowLeft, CheckCircle, X, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateFOMOScore, getFOMOColor, getFOMOLabel, getFlameCount } from '../utils/fomoIndex';
import AuthModal from '../components/AuthModal';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, rsvpEventIds, waitlistEventIds, savedEventIds, rsvpToEvent, cancelRsvp, saveEvent, unsaveEvent } = useApp();
  const [showAuth, setShowAuth] = useState(false);
  const [rsvpState, setRsvpState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [showShareToast, setShowShareToast] = useState(false);

  const event = mockEvents.find(e => e.id === id);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h2>
          <Link to="/" className="text-primary-600 hover:text-primary-700">Return to homepage</Link>
        </div>
      </div>
    );
  }

  const fomo = calculateFOMOScore(event);
  const fomoColor = getFOMOColor(fomo.total);
  const fomoLabel = getFOMOLabel(fomo.total);
  const flames = '🔥'.repeat(getFlameCount(fomo.total));
  const percentageSold = Math.round((event.ticketsSold / event.capacity) * 100);
  const spotsLeft = event.capacity - event.ticketsSold;
  const isRsvped = rsvpEventIds.has(event.id);
  const isWaitlisted = waitlistEventIds.has(event.id);
  const isSaved = savedEventIds.has(event.id);
  const isSoldOut = spotsLeft <= 0;

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (s: string) => new Date(s).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const handleRSVP = async () => {
    if (isRsvped || isWaitlisted) {
      setRsvpState('loading');
      try {
        await cancelRsvp(event.id);
        setRsvpMessage(isWaitlisted ? 'Removed from waitlist.' : 'RSVP cancelled.');
        setRsvpState('success');
      } catch (e) {
        setRsvpMessage(e instanceof Error ? e.message : 'Failed to cancel');
        setRsvpState('error');
      }
      setTimeout(() => setRsvpState('idle'), 3000);
      return;
    }

    if (!user) { setShowAuth(true); return; }

    setRsvpState('loading');
    try {
      const result = await rsvpToEvent(event.id);
      if (result.waitlist) {
        setRsvpMessage(`You're #${result.position} on the waitlist! We'll notify you if a spot opens.`);
      } else {
        const msg = result.isFirstEvent
          ? "You're in! 🎉 First event FREE — enjoy the experience!"
          : result.totalPaid === 0
            ? "You're in! 🎉 This event is free!"
            : `You're in! 🎉 $${result.totalPaid} charged to your card.`;
        setRsvpMessage(msg);
      }
      setRsvpState('success');
    } catch (e) {
      setRsvpMessage(e instanceof Error ? e.message : 'Failed to RSVP');
      setRsvpState('error');
    }
  };

  const handleSave = async () => {
    try {
      if (isSaved) {
        await unsaveEvent(event.id);
      } else {
        await saveEvent(event.id);
      }
    } catch { /* optimistic update already applied in context */ }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text: event.description, url });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2500);
      } catch {
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2500);
      }
    }
  };

  const rsvpButtonLabel = () => {
    if (rsvpState === 'loading') return 'Processing...';
    if (isRsvped) return "✓ You're Going — Cancel?";
    if (isWaitlisted) return "On Waitlist — Leave Queue?";
    if (isSoldOut) return "Join Waitlist";
    return 'Reserve Your Spot';
  };

  const rsvpButtonClass = () => {
    if (isRsvped) return 'bg-green-100 text-green-800 border-2 border-green-400 hover:bg-red-50 hover:text-red-700 hover:border-red-400 w-full text-lg py-4 rounded-lg font-semibold transition-all disabled:opacity-60';
    if (isWaitlisted) return 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400 hover:bg-red-50 hover:text-red-700 hover:border-red-400 w-full text-lg py-4 rounded-lg font-semibold transition-all disabled:opacity-60';
    if (isSoldOut) return 'bg-orange-500 hover:bg-orange-600 text-white w-full text-lg py-4 rounded-lg font-semibold transition-all disabled:opacity-60';
    return 'btn-primary w-full text-lg py-4 rounded-lg font-semibold disabled:opacity-60';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {showShareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium">
          Link copied to clipboard!
        </div>
      )}

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />Back to events
        </Link>
      </div>

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <div className="flex items-center space-x-3 mb-4">
              <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold capitalize">
                {event.category.replace('-', ' & ')}
              </span>
              <span className={`${fomoColor} text-white px-4 py-2 rounded-full text-sm font-bold`}>
                {flames} FOMO: {fomo.total}
              </span>
              {isSoldOut && !isRsvped && !isWaitlisted && (
                <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                  SOLD OUT
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{event.title}</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* FOMO Alert */}
            <div className={`${fomoColor} text-white p-6 rounded-xl`}>
              <div className="flex items-center space-x-3 mb-2">
                <Flame className="w-6 h-6" />
                <h3 className="text-xl font-bold">{fomoLabel}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span>{percentageSold}% sold out</span>
                <span>•</span>
                <span>{isSoldOut ? 'Sold out!' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}</span>
                <span>•</span>
                <span>{event.attendees} people going</span>
              </div>

              {/* FOMO Breakdown */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  <div className="font-semibold">Fill Rate</div>
                  <div>{fomo.fillRate}/40 pts</div>
                </div>
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  <div className="font-semibold">Time Pressure</div>
                  <div>{fomo.timePressure}/25 pts</div>
                </div>
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  <div className="font-semibold">Social Proof</div>
                  <div>{fomo.socialProof}/20 pts</div>
                </div>
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  <div className="font-semibold">Friend Factor</div>
                  <div>{fomo.friendFactor}/15 pts</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-700 text-lg leading-relaxed">{event.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {event.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm">#{tag}</span>
                ))}
              </div>
            </div>

            {/* Organizer */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Organizer</h2>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎭</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{event.organizerName}</h3>
                  <p className="text-gray-600">Verified Organizer</p>
                </div>
              </div>
            </div>

            {/* Friends */}
            {event.friendsGoing > 0 && (
              <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Users className="w-6 h-6 text-primary-600" />
                  <h3 className="text-xl font-bold text-gray-900">{event.friendsGoing} of your friends are going!</h3>
                </div>
                <p className="text-gray-700">Join them for an amazing experience. Events are more fun with friends!</p>
              </div>
            )}
          </div>

          {/* Right Column — Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-xl p-8 sticky top-24">
              {/* Price */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                {event.price === 0 ? (
                  <div>
                    <div className="text-4xl font-bold text-green-600 mb-2">FREE</div>
                    <p className="text-sm text-gray-600">No charge for this event</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline space-x-2 mb-2">
                      <span className="text-4xl font-bold text-gray-900">${event.price}</span>
                      <span className="text-gray-600">per ticket</span>
                    </div>
                    {!user && (
                      <p className="text-sm text-green-600 font-semibold">🎁 Your first event is FREE!</p>
                    )}
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">{formatDate(event.startTime)}</div>
                    <div className="text-sm text-gray-600">{formatTime(event.startTime)} – {formatTime(event.endTime)}</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">{event.venue.name}</div>
                    <div className="text-sm text-gray-600">{event.venue.address}</div>
                    <div className="text-sm text-gray-600">{event.venue.neighborhood}, Seattle</div>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.venue.address + ', Seattle, WA')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline mt-1 inline-block"
                    >
                      View on Google Maps →
                    </a>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">{event.attendees} attending</div>
                    <div className="text-sm text-gray-600">
                      {isSoldOut ? (
                        <span className="text-red-600 font-medium">Sold out — join the waitlist!</span>
                      ) : (
                        `${spotsLeft} of ${event.capacity} spots left`
                      )}
                    </div>
                  </div>
                </div>
                {isWaitlisted && (
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                    <div className="text-sm text-yellow-700 font-medium">
                      You're on the waitlist — we'll notify you if a spot opens.
                    </div>
                  </div>
                )}
              </div>

              {/* RSVP feedback */}
              {rsvpState === 'success' && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm flex items-center space-x-2" role="status">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{rsvpMessage}</span>
                </div>
              )}
              {rsvpState === 'error' && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2" role="alert">
                  <X className="w-4 h-4 flex-shrink-0" />
                  <span>{rsvpMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleRSVP}
                  disabled={rsvpState === 'loading'}
                  className={rsvpButtonClass()}
                >
                  {rsvpButtonLabel()}
                </button>

                <button
                  onClick={handleSave}
                  aria-label={isSaved ? 'Remove from saved events' : 'Save event for later'}
                  className="w-full btn-secondary py-3 flex items-center justify-center space-x-2"
                >
                  {isSaved ? <BookmarkCheck className="w-5 h-5 text-primary-600" /> : <Bookmark className="w-5 h-5" />}
                  <span>{isSaved ? 'Saved!' : 'Save for Later'}</span>
                </button>

                <button
                  onClick={handleShare}
                  aria-label="Share event"
                  className="w-full btn-secondary py-3 flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share Event</span>
                </button>
              </div>

              {/* Premium Upsell */}
              {(!user || user.membership_tier === 'free') && (
                <div className="mt-6 p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    <span className="font-bold text-gray-900">Premium Member Benefit</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Get early access to high-demand events like this one. Upgrade to Premium today!
                  </p>
                  <Link to="/profile" className="text-sm text-primary-600 font-semibold hover:underline">
                    Upgrade now →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
