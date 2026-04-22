import { useState, useMemo } from 'react';
import Hero from '../components/Hero';
import EventCard from '../components/EventCard';
import { mockEvents, NEIGHBORHOODS } from '../data/mockEvents';
import { Flame, TrendingUp, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateFOMOScore } from '../utils/fomoIndex';

const CATEGORIES = [
  { id: 'all', label: 'All Events', icon: '🎯' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'food-drink', label: 'Food & Drink', icon: '🍽️' },
  { id: 'arts-culture', label: 'Arts & Culture', icon: '🎨' },
  { id: 'sports-fitness', label: 'Sports', icon: '⚽' },
  { id: 'networking', label: 'Networking', icon: '🤝' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { id: 'learning', label: 'Learning', icon: '📚' },
  { id: 'community', label: 'Community', icon: '🏘️' },
];

const DATE_RANGES = [
  { id: 'all', label: 'Any date' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
];

const SORT_OPTIONS = [
  { id: 'fomo', label: 'FOMO Score' },
  { id: 'date', label: 'Date' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
];

export default function HomePage() {
  const { searchQuery } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('fomo');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // Apply real FOMO scores
  const eventsWithRealFomo = useMemo(() =>
    mockEvents.map(e => ({ ...e, fomoScore: calculateFOMOScore(e).total })),
    []
  );

  const filteredEvents = useMemo(() => {
    let events = eventsWithRealFomo;

    if (selectedCategory !== 'all') {
      events = events.filter(e => e.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.venue.name.toLowerCase().includes(q) ||
        e.venue.neighborhood.toLowerCase().includes(q) ||
        e.organizerName.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (selectedNeighborhood) {
      events = events.filter(e => e.venue.neighborhood === selectedNeighborhood);
    }

    if (maxPrice !== '') {
      events = events.filter(e => e.price <= (maxPrice as number));
    }

    if (showFreeOnly) {
      events = events.filter(e => e.price === 0);
    }

    if (dateRange !== 'all') {
      const now = Date.now();
      const dayMs = 86400000;
      events = events.filter(e => {
        const start = new Date(e.startTime).getTime();
        if (dateRange === 'today') return start >= now && start < now + dayMs;
        if (dateRange === 'week') return start >= now && start < now + 7 * dayMs;
        if (dateRange === 'month') return start >= now && start < now + 30 * dayMs;
        return true;
      });
    }

    return [...events].sort((a, b) => {
      if (sortBy === 'fomo') return b.fomoScore - a.fomoScore;
      if (sortBy === 'date') return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });
  }, [eventsWithRealFomo, selectedCategory, searchQuery, selectedNeighborhood, maxPrice, showFreeOnly, dateRange, sortBy]);

  const hotEvents = useMemo(() =>
    eventsWithRealFomo
      .filter(e => e.fomoScore >= 80)
      .sort((a, b) => b.fomoScore - a.fomoScore)
      .slice(0, 3),
    [eventsWithRealFomo]
  );

  const hasActiveFilters = maxPrice !== '' || selectedNeighborhood || dateRange !== 'all' || showFreeOnly;

  const clearFilters = () => {
    setMaxPrice('');
    setSelectedNeighborhood('');
    setDateRange('all');
    setSortBy('fomo');
    setShowFreeOnly(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      {/* Hot Events Section — only show when not searching */}
      {!searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center space-x-3 mb-6">
            <Flame className="w-8 h-8 text-red-500" />
            <h2 className="text-3xl font-bold text-gray-900">Hottest Events Right Now</h2>
          </div>
          <p className="text-gray-600 mb-8">These events are selling out fast! Don't miss your chance.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotEvents.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        </section>
      )}

      {/* Discover Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-primary-600" />
            <h2 className="text-3xl font-bold text-gray-900">
              {searchQuery ? `Results for "${searchQuery}"` : 'Discover Events'}
            </h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              hasActiveFilters
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium">Filters{hasActiveFilters ? ' •' : ''}</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-3 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <span className="mr-1.5">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Advanced Filters</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700">
                  <X className="w-4 h-4" />
                  <span>Clear all</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select value={dateRange} onChange={e => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm">
                  {DATE_RANGES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood</label>
                <select value={selectedNeighborhood} onChange={e => setSelectedNeighborhood(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm">
                  <option value="">All neighborhoods</option>
                  {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="number" min="0" step="5" value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="No limit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm">
                  {SORT_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={showFreeOnly} onChange={e => setShowFreeOnly(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded" />
                <span className="text-sm font-medium text-gray-700">Free events only</span>
              </label>
            </div>
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
        </p>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => <EventCard key={event.id} event={event} />)}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search query.</p>
            <button onClick={() => { clearFilters(); setSelectedCategory('all'); }}
              className="btn-secondary">
              Reset all filters
            </button>
          </div>
        )}
      </section>

      {/* Why SeattleSocial */}
      <section className="bg-white py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why SeattleSocial?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🔥</div>
              <h3 className="text-xl font-bold mb-3">FOMO Index</h3>
              <p className="text-gray-600">Real-time social proof shows you what's hot before it sells out</p>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4">🎥</div>
              <h3 className="text-xl font-bold mb-3">Rich Media</h3>
              <p className="text-gray-600">High-quality video previews so you know exactly what to expect</p>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3">Social First</h3>
              <p className="text-gray-600">See who's going and coordinate with friends before you commit</p>
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
              <p className="text-gray-400">Never miss out on Seattle's best experiences</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="/profile" className="hover:text-white">Premium</a></li>
                <li><a href="/organizer" className="hover:text-white">Organizers</a></li>
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
