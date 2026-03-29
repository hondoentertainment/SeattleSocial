import { useState } from 'react';
import type { Event } from '../types';
import {
  MapPin,
  Calendar,
  Users,
  Flame,
  Heart,
  Play,
  Music,
  UtensilsCrossed,
  Palette,
  Dumbbell,
  Handshake,
  Moon,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSavedEvents } from '../hooks/useSavedEvents';
import { mockFriendsGoingData } from '../data/mockSocial';
import { trackEvent } from '../lib/analytics';

interface EventCardProps {
  event: Event;
}

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

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export default function EventCard({ event }: EventCardProps) {
  const [showFriendsPopup, setShowFriendsPopup] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isSaved, toggleSaved } = useSavedEvents();

  const saved = isSaved(event.id);
  const friendsData = mockFriendsGoingData.find(d => d.eventId === event.id);
  const friendsGoing = friendsData?.friends ?? [];

  const getFOMOBadgeClass = (score: number): string => {
    if (score >= 80) return 'fomo-badge-extreme';
    if (score >= 60) return 'fomo-badge-high';
    if (score >= 40) return 'fomo-badge-moderate';
    return 'fomo-badge-low';
  };

  const getFOMOLabel = (score: number): string => {
    if (score >= 80) return 'Selling out fast!';
    if (score >= 60) return 'High demand';
    if (score >= 40) return 'Popular event';
    return 'Rising interest';
  };

  const getFlameCount = (score: number): number => {
    if (score >= 80) return 3;
    if (score >= 60) return 2;
    if (score >= 40) return 1;
    return 0;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const flames = Array(getFlameCount(event.fomoScore)).fill(null);
  const percentageSold = Math.round((event.ticketsSold / event.capacity) * 100);

  const CategoryIcon = categoryIcons[event.category] ?? Calendar;

  const handleCardClick = (): void => {
    trackEvent('event_card_clicked', { eventId: event.id, title: event.title });
  };

  const handleSaveClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(event.id);
    trackEvent('event_save_toggled', { eventId: event.id, saved: !saved });
  };

  return (
    <Link
      to={`/events/${event.id}`}
      onClick={handleCardClick}
      className="focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
    >
      <article className="card hover:scale-[1.02] transition-transform duration-300">
        {/* Image */}
        <div className="relative h-48 bg-gray-200 group">
          {imageError ? (
            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-800 flex items-center justify-center">
              <CategoryIcon className="w-16 h-16 text-white/40" />
            </div>
          ) : (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          )}

          {/* Video play overlay */}
          {event.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                <Play className="w-6 h-6 text-gray-900 ml-0.5" aria-hidden="true" />
              </div>
              <span className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Preview
              </span>
            </div>
          )}

          {/* FOMO Badge */}
          <div className="absolute top-3 right-3">
            <div
              className={getFOMOBadgeClass(event.fomoScore)}
              role="status"
              aria-label={`FOMO score ${event.fomoScore}`}
            >
              {flames.map((_, i) => (
                <Flame key={i} className="w-3.5 h-3.5 inline" aria-hidden="true" />
              ))}{' '}
              {event.fomoScore}
            </div>
          </div>

          {/* Save / Heart Button */}
          <button
            onClick={handleSaveClick}
            className="absolute top-3 left-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-all group/save focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={saved ? 'Remove from saved' : 'Save event'}
          >
            <Heart
              className={`w-5 h-5 transition-all duration-300 ${
                saved
                  ? 'fill-red-500 text-red-500 scale-110'
                  : 'text-gray-600 group-hover/save:text-red-400'
              }`}
              aria-hidden="true"
            />
          </button>

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
            <Flame className="w-4 h-4 text-red-500" aria-hidden="true" />
            <span className="text-sm font-semibold text-red-600">
              {getFOMOLabel(event.fomoScore)} - {percentageSold}% sold
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>

          {/* Friends going social proof */}
          {friendsGoing.length > 0 && (
            <div className="relative mb-4">
              <button
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFriendsPopup(!showFriendsPopup);
                }}
                className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                aria-label={`${friendsGoing.length} friends going to ${event.title}`}
              >
                {/* Overlapping avatars */}
                <div className="flex -space-x-2">
                  {friendsGoing.slice(0, 3).map((friend) => (
                    <div
                      key={friend.id}
                      className="w-7 h-7 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-primary-700 text-xs font-bold"
                      role="img"
                      aria-label={friend.displayName}
                    >
                      {getInitials(friend.displayName)}
                    </div>
                  ))}
                </div>
                <span className="font-semibold">
                  <Users className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                  {friendsGoing.length} friend{friendsGoing.length !== 1 ? 's' : ''} going
                  {friendsGoing.length > 3 && ` (and ${friendsGoing.length - 3} others)`}
                </span>
              </button>

              {/* Friends popup */}
              {showFriendsPopup && (
                <div
                  className="absolute z-10 bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[180px]"
                  role="tooltip"
                >
                  <p className="text-xs font-semibold text-gray-500 mb-2">Friends going:</p>
                  {friendsGoing.map((f) => (
                    <p key={f.id} className="text-sm text-gray-700 py-0.5">{f.displayName}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Event Details */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>{formatDate(event.startTime)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              <span>{event.venue.name} &bull; {event.venue.neighborhood}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" aria-hidden="true" />
              <span>{event.attendees} going</span>
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
            <span className="btn-primary text-sm py-2" role="link">
              View Details
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
