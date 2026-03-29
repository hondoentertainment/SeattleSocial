import { useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import EventCard from '../components/EventCard';
import Pagination from '../components/Pagination';
import { useApi } from '../hooks/useApi';
import { mockEvents } from '../data/mockEvents';
import { Flame, TrendingUp } from 'lucide-react';
import type { Event } from '../types';

const ITEMS_PER_PAGE = 12;

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: events, loading } = useApi<Event[]>(
    async () => {
      // TODO: Replace with real API call
      return mockEvents;
    },
    mockEvents,
    []
  );

  const categories = [
    { id: 'all', label: 'All Events', icon: '🎯' },
    { id: 'music', label: 'Music', icon: '🎵' },
    { id: 'food-drink', label: 'Food & Drink', icon: '🍽️' },
    { id: 'arts-culture', label: 'Arts & Culture', icon: '🎨' },
    { id: 'sports-fitness', label: 'Sports', icon: '⚽' },
    { id: 'networking', label: 'Networking', icon: '🤝' },
    { id: 'nightlife', label: 'Nightlife', icon: '🌙' },
  ];

  const allEvents = events ?? [];

  const filteredEvents = selectedCategory === 'all'
    ? allEvents
    : allEvents.filter(event => event.category === selectedCategory);

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredEvents.length);

  const hotEvents = allEvents
    .filter(event => event.fomoScore >= 80)
    .sort((a, b) => b.fomoScore - a.fomoScore)
    .slice(0, 3);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <div className="h-8 bg-gray-200 rounded w-16" />
          <div className="h-8 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      {/* Hot Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center space-x-3 mb-6">
          <Flame className="w-8 h-8 text-red-500" />
          <h2 className="text-3xl font-bold text-gray-900">Hottest Events Right Now</h2>
        </div>
        <p className="text-gray-600 mb-8">These events are selling out fast! Don't miss your chance.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? [1, 2, 3].map(i => <SkeletonCard key={i} />)
            : hotEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))
          }
        </div>
      </section>

      {/* Category Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="w-8 h-8 text-primary-600" />
          <h2 className="text-3xl font-bold text-gray-900">Discover Events</h2>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? [1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)
            : paginatedEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))
          }
        </div>

        {!loading && filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No events found in this category.</p>
          </div>
        )}

        {!loading && filteredEvents.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {startIndex + 1}-{endIndex} of {filteredEvents.length} events
          </div>
        )}

        {!loading && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why SeattleSocial?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🔥</div>
              <h3 className="text-xl font-bold mb-3">FOMO Index</h3>
              <p className="text-gray-600">
                Real-time social proof shows you what's hot before it sells out
              </p>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4">🎥</div>
              <h3 className="text-xl font-bold mb-3">Rich Media</h3>
              <p className="text-gray-600">
                High-quality video previews so you know exactly what to expect
              </p>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3">Social First</h3>
              <p className="text-gray-600">
                See who's going and coordinate with friends before you commit
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xl font-bold mb-4">SeattleSocial</h4>
              <p className="text-gray-400">
                Never miss out on Seattle's best experiences
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/events" className="hover:text-white">Discover</Link></li>
                <li><Link to="/calendar" className="hover:text-white">My Events</Link></li>
                <li><Link to="/notifications" className="hover:text-white">Notifications</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Account</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/login" className="hover:text-white">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-white">Create Account</Link></li>
                <li><Link to="/profile" className="hover:text-white">Profile</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 SeattleSocial. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
