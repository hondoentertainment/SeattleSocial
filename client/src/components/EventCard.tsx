import { Event } from '../types';
import { MapPin, Calendar, Users, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const getFOMOBadgeClass = (score: number) => {
    if (score >= 80) return 'fomo-badge-extreme';
    if (score >= 60) return 'fomo-badge-high';
    if (score >= 40) return 'fomo-badge-moderate';
    return 'fomo-badge-low';
  };

  const getFOMOLabel = (score: number) => {
    if (score >= 80) return 'Selling out fast!';
    if (score >= 60) return 'High demand';
    if (score >= 40) return 'Popular event';
    return 'Rising interest';
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const flames = Array(getFlameCount(event.fomoScore)).fill('🔥').join('');
  const percentageSold = Math.round((event.ticketsSold / event.capacity) * 100);

  return (
    <Link to={`/events/${event.id}`}>
      <div className="card hover:scale-[1.02] transition-transform duration-300">
        {/* Image */}
        <div className="relative h-48 bg-gray-200">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {/* FOMO Badge */}
          <div className="absolute top-3 right-3">
            <div className={getFOMOBadgeClass(event.fomoScore)}>
              {flames} {event.fomoScore}
            </div>
          </div>
          {/* Category Badge */}
          <div className="absolute bottom-3 left-3">
            <span className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
              {event.category.replace('-', ' & ')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {event.title}
          </h3>

          {/* FOMO Message */}
          <div className="flex items-center space-x-2 mb-3">
            <Flame className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-600">
              {getFOMOLabel(event.fomoScore)} - {percentageSold}% sold
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>

          {/* Event Details */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(event.startTime)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>{event.venue.name} • {event.venue.neighborhood}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>
                {event.attendees} going
                {event.friendsGoing > 0 && (
                  <span className="font-semibold text-primary-600 ml-1">
                    • {event.friendsGoing} friends going
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-200">
            <div>
              {event.price === 0 ? (
                <span className="text-2xl font-bold text-green-600">FREE</span>
              ) : (
                <span className="text-2xl font-bold text-gray-900">${event.price}</span>
              )}
            </div>
            <button className="btn-primary text-sm py-2">
              View Details
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
