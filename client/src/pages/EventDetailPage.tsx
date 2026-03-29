import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { mockFriendsGoingData } from '../data/mockSocial';
import { useSavedEvents } from '../hooks/useSavedEvents';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Toast';
import { EventDetailSkeleton } from '../components/Skeleton';
import CheckoutModal from '../components/CheckoutModal';
import ConfirmDialog from '../components/ConfirmDialog';
import PremiumBadge from '../components/PremiumBadge';
import PremiumGate from '../components/PremiumGate';
import VideoPlayer from '../components/VideoPlayer';
import FriendPickerModal from '../components/FriendPickerModal';
import SEOHead from '../components/SEOHead';
import { getBookingForEvent, addBooking, cancelBooking as cancelBookingStorage, getMembershipTier } from '../utils/storage';
import { downloadICS } from '../utils/calendar';
import { trackEvent, trackBooking, trackShare } from '../lib/analytics';
import {
  MapPin,
  Calendar,
  Users,
  Flame,
  Share2,
  Heart,
  TrendingUp,
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle,
  CalendarPlus,
  Loader2,
  XCircle,
  UserPlus,
  SearchX,
  Music,
  UtensilsCrossed,
  Palette,
  Dumbbell,
  Handshake,
  Moon,
  BookOpen,
} from 'lucide-react';
import type { Booking } from '../types';

const categoryIcons: Record<string, typeof Music> = {
  music: Music,
  'food-drink': UtensilsCrossed,
  'arts-culture': Palette,
  'sports-fitness': Dumbbell,
  networking: Handshake,
  nightlife: Moon,
  learning: BookOpen,
  community: Heart,
};

function generateBookingId(): string {
  return `bk-${crypto.randomUUID()}`;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isSaved, toggleSaved } = useSavedEvents();
  const { toasts, addToast, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [heroImageError, setHeroImageError] = useState(false);

  // Booking state
  const [ticketCount, setTicketCount] = useState(1);
  const [booking, setBooking] = useState<Booking | undefined>(() =>
    id ? getBookingForEvent(id) : undefined
  );
  const [isBooking, setIsBooking] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Friend invite state
  const [inviteOpen, setInviteOpen] = useState(false);

  const membershipTier = getMembershipTier();

  useEffect(() => {
    // Simulated load (infrastructure in place for real async)
    setLoading(false);
  }, []);

  const event = mockEvents.find(e => e.id === id);

  if (loading) {
    return <EventDetailSkeleton />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <SEOHead title="Event Not Found" />
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <SearchX className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Event not found</h2>
          <p className="text-gray-600 mb-6">
            This event may have been removed or the link is incorrect.
          </p>
          <Link to="/" className="btn-primary inline-block">
            Browse all events
          </Link>
        </div>
      </div>
    );
  }

  // Social data
  const friendsData = mockFriendsGoingData.find(d => d.eventId === event.id);
  const friendsGoing = friendsData?.friends ?? [];

  // Save/share handlers
  const saved = isSaved(event.id);

  const CategoryIcon = categoryIcons[event.category] ?? Calendar;

  const handleToggleSave = () => {
    toggleSaved(event.id);
    trackEvent(saved ? 'event_unsaved' : 'event_saved', { eventId: event.id });
    addToast(saved ? 'Event removed from saved' : 'Event saved!', 'success');
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: event.title,
      text: `Check out ${event.title} on SeattleSocial!`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        trackShare(event.id, 'web_share_api');
      } catch {
        // User cancelled share - no action needed
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        trackShare(event.id, 'clipboard');
        addToast('Link copied to clipboard!', 'success');
      } catch {
        addToast('Failed to copy link', 'error');
      }
    }
  };

  // FOMO helpers
  const getFOMOBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getFOMOLabel = (score: number) => {
    if (score >= 80) return 'Selling out fast! Only few spots left';
    if (score >= 60) return 'High demand - book soon!';
    if (score >= 40) return 'Popular event';
    return 'Just announced - growing interest';
  };

  const getFlameCount = (score: number) => {
    if (score >= 80) return 3;
    if (score >= 60) return 2;
    if (score >= 40) return 1;
    return 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const flames = Array(getFlameCount(event.fomoScore)).fill(null);
  const percentageSold = Math.round((event.ticketsSold / event.capacity) * 100);
  const spotsLeft = event.capacity - event.ticketsSold;
  const isSoldOut = spotsLeft <= 0;
  const isFree = event.price === 0;
  const totalPrice = event.price * ticketCount;

  // Capacity color
  const capacityColor =
    percentageSold > 80
      ? 'bg-red-500'
      : percentageSold > 50
        ? 'bg-yellow-500'
        : 'bg-green-500';

  // Booking handlers
  const handleBookFree = () => {
    setIsBooking(true);
    setTimeout(() => {
      const newBooking: Booking = {
        id: generateBookingId(),
        eventId: event.id,
        userId: 'user-1',
        ticketCount,
        totalPaid: 0,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
      };
      addBooking(newBooking);
      setBooking(newBooking);
      setIsBooking(false);
      setShowConfirmation(true);
      trackBooking(event.id, 0);
      addToast(`You're confirmed for ${event.title}!`, 'success');
    }, 800);
  };

  const handleBookPaid = () => {
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = () => {
    const finalPrice = Math.round((event.price * ticketCount * 1.1) * 100) / 100;
    const newBooking: Booking = {
      id: generateBookingId(),
      eventId: event.id,
      userId: 'user-1',
      ticketCount,
      totalPaid: finalPrice,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };
    addBooking(newBooking);
    setBooking(newBooking);
    setShowCheckout(false);
    setShowConfirmation(true);
    trackBooking(event.id, finalPrice);
    addToast(`You're confirmed for ${event.title}!`, 'success');
  };

  const handleCancelBooking = () => {
    if (booking) {
      cancelBookingStorage(booking.id);
      setBooking(undefined);
      setShowCancelDialog(false);
      addToast('Booking cancelled', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={event.title}
        description={event.description}
        ogImage={event.imageUrl}
        ogUrl={`/events/${event.id}`}
      />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
        >
          <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
          Back to events
        </Link>
      </div>

      {/* Hero Image / Video */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
          {event.videoUrl ? (
            <VideoPlayer videoUrl={event.videoUrl} imageUrl={event.imageUrl} title={event.title} />
          ) : heroImageError ? (
            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-800 flex items-center justify-center">
              <CategoryIcon className="w-24 h-24 text-white/40" />
            </div>
          ) : (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setHeroImageError(true)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          <div className="absolute bottom-8 left-8 right-8 pointer-events-none">
            <div className="flex items-center space-x-3 mb-4">
              <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold">
                {event.category.replace('-', ' & ')}
              </span>
              <span className={`${getFOMOBadgeClass(event.fomoScore)} text-white px-4 py-2 rounded-full text-sm font-bold`}>
                {flames.map((_, i) => (
                  <Flame key={i} className="w-3.5 h-3.5 inline" aria-hidden="true" />
                ))} FOMO: {event.fomoScore}
              </span>
              {booking && (
                <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4" aria-hidden="true" />
                  <span>You're going!</span>
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* FOMO Alert */}
            <div className={`${getFOMOBadgeClass(event.fomoScore)} text-white p-6 rounded-xl`} role="alert">
              <div className="flex items-center space-x-3 mb-2">
                <Flame className="w-6 h-6" aria-hidden="true" />
                <h2 className="text-xl font-bold">{getFOMOLabel(event.fomoScore)}</h2>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <span>{percentageSold}% sold out</span>
                <span>&bull;</span>
                <span>Only {spotsLeft} spots remaining</span>
                <span>&bull;</span>
                <span>{event.attendees} people going</span>
              </div>
            </div>

            {/* Post-Booking Confirmation */}
            {showConfirmation && booking && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">You're going!</h3>
                <div className="space-y-1 text-gray-700 mb-6">
                  <p className="font-semibold">{event.title}</p>
                  <p>{formatDate(event.startTime)}</p>
                  <p>{event.venue.name}, {event.venue.neighborhood}</p>
                  <p className="text-sm text-gray-500">
                    {booking.ticketCount} ticket{booking.ticketCount > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => downloadICS(event)}
                    className="btn-primary flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-primary-500"
                    aria-label="Download calendar file for this event"
                  >
                    <CalendarPlus className="w-5 h-5" aria-hidden="true" />
                    <span>Add to Calendar</span>
                  </button>
                  <Link to="/my-events" className="btn-secondary text-center">
                    View My Events
                  </Link>
                </div>
              </div>
            )}

            {/* Description */}
            <section className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                {event.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {event.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </section>

            {/* Organizer */}
            <section className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Organizer</h2>
              <div className="flex items-center space-x-4">
                <div
                  className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center"
                  role="img"
                  aria-label={`${event.organizerName} logo`}
                >
                  <span className="text-2xl" aria-hidden="true">🎭</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{event.organizerName}</h3>
                  <p className="text-gray-600">Verified Organizer</p>
                </div>
              </div>
            </section>

            {/* Who's Going section (premium-gated) */}
            <PremiumGate featureName="Who's Going" requiredTier="PREMIUM">
              <section className="bg-white rounded-xl shadow-md p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Users className="w-6 h-6 text-primary-600" aria-hidden="true" />
                    <h2 className="text-2xl font-bold text-gray-900">Who's Going</h2>
                  </div>
                  <button
                    onClick={() => {
                      trackEvent('invite_friends_clicked', { eventId: event.id });
                      setInviteOpen(true);
                    }}
                    className="btn-primary text-sm py-2 flex items-center space-x-1 focus-visible:ring-2 focus-visible:ring-primary-500"
                    aria-label={`Invite friends to ${event.title}`}
                  >
                    <UserPlus className="w-4 h-4" aria-hidden="true" />
                    <span>Invite Friends</span>
                  </button>
                </div>

                <p className="text-gray-600 mb-4">{event.attendees} total attendees</p>

                {friendsGoing.length > 0 ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {friendsGoing.length} friend{friendsGoing.length !== 1 ? 's' : ''} going
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {friendsGoing.map(friend => (
                        <div key={friend.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div
                            className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold flex-shrink-0"
                            role="img"
                            aria-label={`${friend.displayName}'s avatar`}
                          >
                            {getInitials(friend.displayName)}
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate">{friend.displayName}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
                    <p className="text-gray-500">None of your friends are going yet.</p>
                    <p className="text-gray-400 text-sm mt-1">Invite friends to join you!</p>
                  </div>
                )}
              </section>
            </PremiumGate>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-xl p-8 sticky top-24">
              {/* Already Booked State */}
              {booking && !showConfirmation ? (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-green-600" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-green-700">You're going!</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {booking.ticketCount} ticket{booking.ticketCount > 1 ? 's' : ''} booked
                    </p>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => downloadICS(event)}
                      className="w-full btn-primary flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-primary-500"
                      aria-label="Download calendar file for this event"
                    >
                      <CalendarPlus className="w-5 h-5" aria-hidden="true" />
                      <span>Add to Calendar</span>
                    </button>
                    <button
                      onClick={() => setShowCancelDialog(true)}
                      className="w-full px-6 py-3 bg-white text-red-600 font-semibold rounded-lg border-2 border-red-300 hover:bg-red-50 transition-colors flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-red-500"
                      aria-label="Cancel your booking"
                    >
                      <XCircle className="w-5 h-5" aria-hidden="true" />
                      <span>Cancel Booking</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    {isFree ? (
                      <div>
                        <span className="inline-block bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full mb-2">FREE</span>
                        <div className="text-4xl font-bold text-green-600 mb-1">$0</div>
                        <p className="text-sm text-gray-600">No charge for this event</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline space-x-2 mb-2">
                          <span className="text-4xl font-bold text-gray-900">${event.price}</span>
                          <span className="text-gray-600">per ticket</span>
                        </div>
                        <p className="text-sm text-green-600 font-semibold">
                          Your first event is FREE!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ticket Selection */}
                  {!showConfirmation && (
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Tickets
                      </label>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setTicketCount(c => Math.max(1, c - 1))}
                          disabled={ticketCount <= 1 || isSoldOut}
                          className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-primary-500 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label="Decrease ticket count"
                        >
                          <Minus className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <span className="text-2xl font-bold text-gray-900 w-12 text-center" aria-live="polite">
                          {ticketCount}
                        </span>
                        <button
                          onClick={() => setTicketCount(c => Math.min(10, c + 1))}
                          disabled={ticketCount >= 10 || isSoldOut}
                          className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-primary-500 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label="Increase ticket count"
                        >
                          <Plus className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                      {!isFree && (
                        <div className="mt-3 text-sm text-gray-600 text-center">
                          {ticketCount} x ${event.price.toFixed(2)} ={' '}
                          <span className="font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Capacity Indicator */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        {event.ticketsSold} of {event.capacity} spots filled
                      </span>
                      <span className="font-semibold text-gray-900">{percentageSold}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5" role="progressbar" aria-valuenow={percentageSold} aria-valuemin={0} aria-valuemax={100}>
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${capacityColor}`}
                        style={{ width: `${Math.min(percentageSold, 100)}%` }}
                      />
                    </div>
                    {spotsLeft <= 20 && spotsLeft > 0 && (
                      <p className="text-xs text-red-600 font-semibold mt-2">
                        Only {spotsLeft} spots left!
                      </p>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-1" aria-hidden="true" />
                      <div>
                        <div className="font-semibold text-gray-900">{formatDate(event.startTime)}</div>
                        <div className="text-sm text-gray-600">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1" aria-hidden="true" />
                      <div>
                        <div className="font-semibold text-gray-900">{event.venue.name}</div>
                        <div className="text-sm text-gray-600">{event.venue.address}</div>
                        <div className="text-sm text-gray-600">{event.venue.neighborhood}, Seattle</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-gray-400 mt-1" aria-hidden="true" />
                      <div>
                        <div className="font-semibold text-gray-900">{event.attendees} attending</div>
                        <div className="text-sm text-gray-600">Capacity: {event.capacity}</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!showConfirmation && (
                    <div className="space-y-3">
                      <button
                        onClick={isFree ? handleBookFree : handleBookPaid}
                        disabled={isSoldOut || isBooking}
                        className={`w-full text-lg py-4 font-semibold rounded-lg transition-all duration-200 shadow-md flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-primary-500 ${
                          isSoldOut
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg'
                        }`}
                      >
                        {isBooking ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                            <span>Booking...</span>
                          </>
                        ) : isSoldOut ? (
                          <span>Sold Out</span>
                        ) : isFree ? (
                          <span>Reserve Your Spot</span>
                        ) : (
                          <span>Book Now - ${totalPrice.toFixed(2)}</span>
                        )}
                      </button>
                      <button
                        onClick={handleToggleSave}
                        className={`w-full py-3 flex items-center justify-center space-x-2 rounded-lg font-semibold border-2 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary-500 ${
                          saved
                            ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                            : 'btn-secondary'
                        }`}
                        aria-pressed={saved}
                        aria-label={saved ? 'Remove from saved events' : 'Save event for later'}
                      >
                        <Heart className={`w-5 h-5 transition-all duration-300 ${saved ? 'fill-red-500 text-red-500' : ''}`} aria-hidden="true" />
                        <span>{saved ? 'Saved' : 'Save for Later'}</span>
                      </button>
                      <button
                        onClick={handleShare}
                        className="w-full btn-secondary py-3 flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-primary-500"
                        aria-label={`Share ${event.title}`}
                      >
                        <Share2 className="w-5 h-5" aria-hidden="true" />
                        <span>Share Event</span>
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Premium Upsell / Badge */}
              {membershipTier === 'FREE' ? (
                <div className="mt-6 p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary-600" aria-hidden="true" />
                    <span className="font-bold text-gray-900">Premium Member Benefit</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Get early access to high-demand events like this one. Upgrade to Premium today!
                  </p>
                  <Link
                    to="/membership"
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                    onClick={() => trackEvent('membership_upgrade_clicked', { source: 'event_detail' })}
                  >
                    View plans &rarr;
                  </Link>
                </div>
              ) : (
                <div className="mt-6 flex justify-center">
                  <PremiumBadge tier={membershipTier} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        open={showCheckout}
        event={event}
        ticketCount={ticketCount}
        onClose={() => setShowCheckout(false)}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Cancel Booking Confirmation */}
      <ConfirmDialog
        open={showCancelDialog}
        title="Cancel Booking"
        message={`Are you sure you want to cancel your booking for "${event.title}"? This action cannot be undone.`}
        confirmText="Cancel Booking"
        confirmColor="red"
        cancelText="Keep Booking"
        onConfirm={handleCancelBooking}
        onCancel={() => setShowCancelDialog(false)}
      />

      {/* Friend Picker Modal */}
      <FriendPickerModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        eventTitle={event.title}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
