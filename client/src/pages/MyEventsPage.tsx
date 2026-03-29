import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { getBookings, cancelBooking } from '../utils/storage';
import { Calendar, MapPin, Ticket, CalendarX, ArrowLeft } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Booking, Event } from '../types';

type Tab = 'upcoming' | 'past';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface BookingWithEvent {
  booking: Booking;
  event: Event;
}

export default function MyEventsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>(() => getBookings());
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const now = new Date();

  const bookingsWithEvents: BookingWithEvent[] = bookings
    .map(b => {
      const event = mockEvents.find(e => e.id === b.eventId);
      return event ? { booking: b, event } : null;
    })
    .filter((x): x is BookingWithEvent => x !== null);

  const upcoming = bookingsWithEvents
    .filter(x => new Date(x.event.startTime) >= now && x.booking.status === 'CONFIRMED')
    .sort((a, b) => new Date(a.event.startTime).getTime() - new Date(b.event.startTime).getTime());

  const past = bookingsWithEvents
    .filter(x => new Date(x.event.startTime) < now || x.booking.status === 'CANCELLED')
    .sort((a, b) => new Date(b.event.startTime).getTime() - new Date(a.event.startTime).getTime());

  const displayed = activeTab === 'upcoming' ? upcoming : past;

  const handleCancel = () => {
    if (!cancelTarget) return;
    cancelBooking(cancelTarget.id);
    setBookings(getBookings());
    setCancelTarget(null);
  };

  const getStatusBadge = (booking: Booking) => {
    if (booking.status === 'CANCELLED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
        Confirmed
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to events
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-600 mt-1">Manage your bookings and upcoming events.</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 rounded-lg p-1 mb-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upcoming ({upcoming.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'past'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Past ({past.length})
          </button>
        </div>

        {/* Booking Cards */}
        {displayed.length === 0 ? (
          <div className="text-center py-16">
            <CalendarX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              {activeTab === 'upcoming'
                ? 'No upcoming events'
                : 'No past events'}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'upcoming'
                ? "You haven't booked any upcoming events yet."
                : "You don't have any past events."}
            </p>
            <Link to="/" className="btn-primary">
              Discover Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map(({ booking, event }) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col sm:flex-row"
              >
                {/* Event Image */}
                <Link to={`/events/${event.id}`} className="sm:w-48 h-40 sm:h-auto flex-shrink-0">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <Link to={`/events/${event.id}`} className="hover:text-primary-600 transition-colors">
                      <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                    </Link>
                    {getStatusBadge(booking)}
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(event.startTime)} at {formatTime(event.startTime)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.venue.name}, {event.venue.neighborhood}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Ticket className="w-4 h-4" />
                      <span>
                        {booking.ticketCount} ticket{booking.ticketCount > 1 ? 's' : ''}
                        {booking.totalPaid > 0 && ` - $${booking.totalPaid.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                  {activeTab === 'upcoming' && booking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => setCancelTarget(booking)}
                      className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Cancel Booking"
        confirmColor="red"
        cancelText="Keep Booking"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
