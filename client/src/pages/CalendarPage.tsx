import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock } from 'lucide-react';
import { mockEvents } from '../data/mockEvents';
import { readSavedEventIds } from '../hooks/useSavedEvents';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const savedIds = readSavedEventIds();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const savedEvents = useMemo(
    () => mockEvents.filter(e => savedIds.includes(e.id)),
    [savedIds]
  );

  const eventsByDay = useMemo(() => {
    const map: Record<number, typeof mockEvents> = {};
    savedEvents.forEach(event => {
      const d = new Date(event.startTime);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(event);
      }
    });
    return map;
  }, [savedEvents, year, month]);

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] || []) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <Calendar className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">My Events Calendar</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Month Navigation */}
              <div className="flex items-center justify-between px-6 py-4 bg-primary-600 text-white">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-primary-500 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold">{monthName}</h2>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-primary-500 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {dayNames.map(day => (
                  <div key={day} className="px-2 py-3 text-center text-sm font-semibold text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7">
                {cells.map((day, index) => {
                  const hasEvents = day !== null && eventsByDay[day];
                  const isToday = isCurrentMonth && day === todayDate;
                  const isSelected = day === selectedDay;

                  return (
                    <button
                      key={index}
                      disabled={day === null}
                      onClick={() => day !== null && setSelectedDay(day === selectedDay ? null : day)}
                      className={`relative h-20 sm:h-24 p-1 sm:p-2 border-b border-r border-gray-100 text-left transition-colors ${
                        day === null
                          ? 'bg-gray-50 cursor-default'
                          : isSelected
                            ? 'bg-primary-50 ring-2 ring-inset ring-primary-400'
                            : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      {day !== null && (
                        <>
                          <span
                            className={`text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full ${
                              isToday
                                ? 'bg-primary-600 text-white'
                                : isSelected
                                  ? 'text-primary-700'
                                  : 'text-gray-700'
                            }`}
                          >
                            {day}
                          </span>
                          {hasEvents && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {eventsByDay[day].slice(0, 3).map(ev => (
                                <div
                                  key={ev.id}
                                  className="w-2 h-2 rounded-full bg-primary-500"
                                  title={ev.title}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Day Detail Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              {selectedDay ? (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {new Date(year, month, selectedDay).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  {selectedEvents.length > 0 ? (
                    <div className="space-y-4">
                      {selectedEvents.map(event => (
                        <Link
                          key={event.id}
                          to={`/events/${event.id}`}
                          className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                        >
                          <h4 className="font-semibold text-gray-900 mb-2">{event.title}</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{event.venue.name}</span>
                            </div>
                          </div>
                          {event.price === 0 ? (
                            <span className="inline-block mt-2 text-sm font-semibold text-green-600">FREE</span>
                          ) : (
                            <span className="inline-block mt-2 text-sm font-semibold text-gray-900">${event.price}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No saved events on this day</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Day</h3>
                  <p className="text-gray-500 text-sm">
                    Click on a day to see your saved events. Dots indicate days with events.
                  </p>
                  {savedEvents.length === 0 && (
                    <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                      <p className="text-sm text-primary-700">
                        No saved events yet. Browse events and tap the heart icon to save them!
                      </p>
                      <Link to="/" className="btn-primary text-sm mt-3 inline-block">
                        Browse Events
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
