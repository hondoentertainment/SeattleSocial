import { useParams, Link } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import {
  MapPin,
  Calendar,
  Users,
  Flame,
  Share2,
  Bookmark,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const event = mockEvents.find(e => e.id === id);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h2>
          <Link to="/" className="text-primary-600 hover:text-primary-700">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

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

  const flames = Array(getFlameCount(event.fomoScore)).fill('🔥').join('');
  const percentageSold = Math.round((event.ticketsSold / event.capacity) * 100);
  const spotsLeft = event.capacity - event.ticketsSold;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to events
        </Link>
      </div>

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <div className="flex items-center space-x-3 mb-4">
              <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold">
                {event.category.replace('-', ' & ')}
              </span>
              <span className={`${getFOMOBadgeClass(event.fomoScore)} text-white px-4 py-2 rounded-full text-sm font-bold`}>
                {flames} FOMO: {event.fomoScore}
              </span>
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
            <div className={`${getFOMOBadgeClass(event.fomoScore)} text-white p-6 rounded-xl`}>
              <div className="flex items-center space-x-3 mb-2">
                <Flame className="w-6 h-6" />
                <h3 className="text-xl font-bold">{getFOMOLabel(event.fomoScore)}</h3>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <span>{percentageSold}% sold out</span>
                <span>•</span>
                <span>Only {spotsLeft} spots remaining</span>
                <span>•</span>
                <span>{event.attendees} people going</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-md p-8">
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

            {/* Social Proof */}
            {event.friendsGoing > 0 && (
              <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Users className="w-6 h-6 text-primary-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    {event.friendsGoing} of your friends are going!
                  </h3>
                </div>
                <p className="text-gray-700">
                  Join them for an amazing experience. Events are more fun with friends!
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Booking Card */}
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
                    <p className="text-sm text-green-600 font-semibold">
                      🎁 Your first event is FREE!
                    </p>
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <div className="font-semibold text-gray-900">{formatDate(event.startTime)}</div>
                    <div className="text-sm text-gray-600">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <div className="font-semibold text-gray-900">{event.venue.name}</div>
                    <div className="text-sm text-gray-600">{event.venue.address}</div>
                    <div className="text-sm text-gray-600">{event.venue.neighborhood}, Seattle</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <div className="font-semibold text-gray-900">{event.attendees} attending</div>
                    <div className="text-sm text-gray-600">Capacity: {event.capacity}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button className="w-full btn-primary text-lg py-4">
                  Reserve Your Spot
                </button>
                <button className="w-full btn-secondary py-3 flex items-center justify-center space-x-2">
                  <Bookmark className="w-5 h-5" />
                  <span>Save for Later</span>
                </button>
                <button className="w-full btn-secondary py-3 flex items-center justify-center space-x-2">
                  <Share2 className="w-5 h-5" />
                  <span>Share Event</span>
                </button>
              </div>

              {/* Premium Upsell */}
              <div className="mt-6 p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                  <span className="font-bold text-gray-900">Premium Member Benefit</span>
                </div>
                <p className="text-sm text-gray-700">
                  Get early access to high-demand events like this one. Upgrade to Premium today!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
