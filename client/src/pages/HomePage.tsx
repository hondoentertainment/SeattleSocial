import { useState, useMemo } from 'react';
import Hero from '../components/Hero';
import EventCard from '../components/EventCard';
import ToastContainer from '../components/Toast';
import SEOHead from '../components/SEOHead';
import { mockEvents } from '../data/mockEvents';
import { useDebounce } from '../hooks/useDebounce';
import { useSavedEvents } from '../hooks/useSavedEvents';
import { useToast } from '../hooks/useToast';
import { trackEvent, trackSearch } from '../lib/analytics';
import { Flame, TrendingUp, X, ChevronDown, SearchX } from 'lucide-react';
import type { DateFilter, PriceFilter, SortOption } from '../types';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('any');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('any');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('any');
  const [sortBy, setSortBy] = useState<SortOption>('fomo');

  const debouncedSearch = useDebounce(searchQuery, 300);
  const { isSaved, toggleSaved } = useSavedEvents();
  const { toasts, addToast, removeToast } = useToast();

  const handleToggleSave = (eventId: string) => {
    const wasSaved = isSaved(eventId);
    toggleSaved(eventId);
    addToast(wasSaved ? 'Event removed from saved' : 'Event saved!', 'success');
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    trackEvent('category_filter_changed', { category: categoryId });
  };

  const handleDateFilterChange = (value: DateFilter) => {
    setDateFilter(value);
    trackEvent('date_filter_changed', { date: value });
  };

  const handlePriceFilterChange = (value: PriceFilter) => {
    setPriceFilter(value);
    trackEvent('price_filter_changed', { price: value });
  };

  const handleNeighborhoodChange = (value: string) => {
    setNeighborhoodFilter(value);
    trackEvent('neighborhood_filter_changed', { neighborhood: value });
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    trackEvent('sort_changed', { sort: value });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      trackSearch(query.trim(), 0);
    }
  };

  const neighborhoods = useMemo(() => {
    const set = new Set(mockEvents.map(e => e.venue.neighborhood));
    return Array.from(set).sort();
  }, []);

  const categories = [
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

  const dateFilterOptions: { id: DateFilter; label: string }[] = [
    { id: 'any', label: 'Any Date' },
    { id: 'today', label: 'Today' },
    { id: 'this-weekend', label: 'This Weekend' },
    { id: 'this-week', label: 'This Week' },
    { id: 'this-month', label: 'This Month' },
  ];

  const priceFilterOptions: { id: PriceFilter; label: string }[] = [
    { id: 'any', label: 'Any Price' },
    { id: 'free', label: 'Free' },
    { id: 'under-25', label: 'Under $25' },
    { id: 'under-50', label: 'Under $50' },
  ];

  const sortOptions: { id: SortOption; label: string }[] = [
    { id: 'fomo', label: 'FOMO Score' },
    { id: 'date', label: 'Date' },
    { id: 'price-low', label: 'Price Low\u2192High' },
    { id: 'price-high', label: 'Price High\u2192Low' },
  ];

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    debouncedSearch !== '' ||
    dateFilter !== 'any' ||
    priceFilter !== 'any' ||
    neighborhoodFilter !== 'any' ||
    sortBy !== 'fomo';

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setDateFilter('any');
    setPriceFilter('any');
    setNeighborhoodFilter('any');
    setSortBy('fomo');
  };

  const matchesDateFilter = (event: typeof mockEvents[0]) => {
    if (dateFilter === 'any') return true;
    const eventDate = new Date(event.startTime);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateFilter) {
      case 'today': {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return eventDate >= today && eventDate < tomorrow;
      }
      case 'this-weekend': {
        const dayOfWeek = today.getDay();
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + (6 - dayOfWeek));
        const monday = new Date(saturday);
        monday.setDate(saturday.getDate() + 2);
        return eventDate >= saturday && eventDate < monday;
      }
      case 'this-week': {
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
        return eventDate >= today && eventDate < endOfWeek;
      }
      case 'this-month': {
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        return eventDate >= today && eventDate < endOfMonth;
      }
      default:
        return true;
    }
  };

  const matchesPriceFilter = (event: typeof mockEvents[0]) => {
    switch (priceFilter) {
      case 'free': return event.price === 0;
      case 'under-25': return event.price < 25;
      case 'under-50': return event.price < 50;
      default: return true;
    }
  };

  const matchesSearch = (event: typeof mockEvents[0]) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      event.title.toLowerCase().includes(q) ||
      event.description.toLowerCase().includes(q) ||
      event.venue.name.toLowerCase().includes(q) ||
      event.venue.neighborhood.toLowerCase().includes(q) ||
      event.tags.some(tag => tag.toLowerCase().includes(q))
    );
  };

  const filteredEvents = useMemo(() => {
    let events = mockEvents.filter(event => {
      if (selectedCategory !== 'all' && event.category !== selectedCategory) return false;
      if (!matchesSearch(event)) return false;
      if (!matchesDateFilter(event)) return false;
      if (!matchesPriceFilter(event)) return false;
      if (neighborhoodFilter !== 'any' && event.venue.neighborhood !== neighborhoodFilter) return false;
      return true;
    });

    switch (sortBy) {
      case 'fomo':
        events.sort((a, b) => b.fomoScore - a.fomoScore);
        break;
      case 'date':
        events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        break;
      case 'price-low':
        events.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        events.sort((a, b) => b.price - a.price);
        break;
    }

    return events;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, debouncedSearch, dateFilter, priceFilter, neighborhoodFilter, sortBy]);

  const hotEvents = mockEvents
    .filter(event => event.fomoScore >= 80)
    .sort((a, b) => b.fomoScore - a.fomoScore)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50" id="main-content">
      <SEOHead
        title="Discover the Best Events in Seattle"
        description="Discover, connect, and experience the hottest events in Seattle. Your first event is on us."
      />
      <Hero searchQuery={searchQuery} onSearchChange={handleSearchChange} />

      {/* Hot Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" aria-labelledby="hot-events-heading">
        <div className="flex items-center space-x-3 mb-6">
          <Flame className="w-8 h-8 text-red-500" aria-hidden="true" />
          <h2 id="hot-events-heading" className="text-3xl font-bold text-gray-900">Hottest Events Right Now</h2>
        </div>
        <p className="text-gray-600 mb-8">These events are selling out fast! Don't miss your chance.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isSaved={isSaved(event.id)}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      </section>

      {/* Category Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-labelledby="discover-heading">
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="w-8 h-8 text-primary-600" aria-hidden="true" />
          <h2 id="discover-heading" className="text-3xl font-bold text-gray-900">Discover Events</h2>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-3 mb-6" role="radiogroup" aria-label="Filter events by category">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              role="radio"
              aria-checked={selectedCategory === category.id}
              className={`px-6 py-3 rounded-full font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary-500 ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <span className="mr-2" aria-hidden="true">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>

        {/* Advanced Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Date Filter Pills */}
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter by date">
              {dateFilterOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleDateFilterChange(opt.id)}
                  role="radio"
                  aria-checked={dateFilter === opt.id}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    dateFilter === opt.id
                      ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="w-px h-8 bg-gray-200 hidden sm:block" aria-hidden="true" />

            {/* Price Filter Pills */}
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter by price">
              {priceFilterOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handlePriceFilterChange(opt.id)}
                  role="radio"
                  aria-checked={priceFilter === opt.id}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    priceFilter === opt.id
                      ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="w-px h-8 bg-gray-200 hidden sm:block" aria-hidden="true" />

            {/* Neighborhood Dropdown */}
            <div className="relative">
              <label htmlFor="neighborhood-filter" className="sr-only">Filter by neighborhood</label>
              <select
                id="neighborhood-filter"
                value={neighborhoodFilter}
                onChange={(e) => handleNeighborhoodChange(e.target.value)}
                className="appearance-none bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 pr-8 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer"
              >
                <option value="any">All Neighborhoods</option>
                {neighborhoods.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
            </div>

            {/* Sort By Dropdown */}
            <div className="relative">
              <label htmlFor="sort-filter" className="sr-only">Sort events</label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="appearance-none bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 pr-8 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer"
              >
                {sortOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>Sort: {opt.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
            </div>

            {/* Clear All */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                Clear all filters
              </button>
            )}
          </div>

          {/* Result Count */}
          <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500" aria-live="polite">
            Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-live="polite">
          {filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isSaved={isSaved(event.id)}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-16">
            <SearchX className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filters to find what you're looking for.</p>
            <button
              onClick={clearAllFilters}
              className="btn-primary"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 mt-12" aria-labelledby="why-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="why-heading" className="text-3xl font-bold text-center text-gray-900 mb-12">Why SeattleSocial?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-6xl mb-4" aria-hidden="true">🔥</div>
              <h3 className="text-xl font-bold mb-3">FOMO Index</h3>
              <p className="text-gray-600">
                Real-time social proof shows you what's hot before it sells out
              </p>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4" aria-hidden="true">🎥</div>
              <h3 className="text-xl font-bold mb-3">Rich Media</h3>
              <p className="text-gray-600">
                High-quality video previews so you know exactly what to expect
              </p>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4" aria-hidden="true">🤝</div>
              <h3 className="text-xl font-bold mb-3">Social First</h3>
              <p className="text-gray-600">
                See who's going and coordinate with friends before you commit
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12" role="contentinfo">
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
                <li><a href="#" className="hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500 rounded">Features</a></li>
                <li><a href="#" className="hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500 rounded">Premium</a></li>
                <li><a href="#" className="hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500 rounded">Organizers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500 rounded">About</a></li>
                <li><a href="#" className="hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500 rounded">Blog</a></li>
                <li><a href="#" className="hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500 rounded">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500 rounded">Privacy</a></li>
                <li><a href="#" className="hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500 rounded">Terms</a></li>
                <li><a href="#" className="hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500 rounded">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 SeattleSocial. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
