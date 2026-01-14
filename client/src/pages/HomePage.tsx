import { useState } from 'react';
import Hero from '../components/Hero';
import EventCard from '../components/EventCard';
import { mockEvents } from '../data/mockEvents';
import { Flame, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Events', icon: '🎯' },
    { id: 'music', label: 'Music', icon: '🎵' },
    { id: 'food-drink', label: 'Food & Drink', icon: '🍽️' },
    { id: 'arts-culture', label: 'Arts & Culture', icon: '🎨' },
    { id: 'sports-fitness', label: 'Sports', icon: '⚽' },
    { id: 'networking', label: 'Networking', icon: '🤝' },
    { id: 'nightlife', label: 'Nightlife', icon: '🌙' },
  ];

  const filteredEvents = selectedCategory === 'all'
    ? mockEvents
    : mockEvents.filter(event => event.category === selectedCategory);

  const hotEvents = mockEvents
    .filter(event => event.fomoScore >= 80)
    .sort((a, b) => b.fomoScore - a.fomoScore)
    .slice(0, 3);

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
          {hotEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
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
              onClick={() => setSelectedCategory(category.id)}
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
          {filteredEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No events found in this category.</p>
          </div>
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
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Premium</a></li>
                <li><a href="#" className="hover:text-white">Organizers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
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
