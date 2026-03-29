import { Search, X } from 'lucide-react';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Hero({ searchQuery, onSearchChange }: HeroProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
      <div className="absolute inset-0 bg-black opacity-20" aria-hidden="true"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Never Miss Out on Seattle's
            <br />
            <span className="text-primary-200">Best Experiences</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
            Discover, connect, and experience the hottest events in Seattle.
            Your first event is on us.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8" role="search" aria-label="Search events">
            <div className="relative">
              <label htmlFor="hero-search" className="sr-only">Search events, venues, or categories</label>
              <input
                id="hero-search"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search events, venues, or categories..."
                className="w-full px-6 py-4 rounded-full text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-primary-300 shadow-xl pr-24"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 transition-colors focus-visible:ring-2 focus-visible:ring-white rounded-full"
                  aria-label="Clear search"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Search"
              >
                <Search className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
          </form>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-sm md:text-base">
            <div>
              <div className="text-3xl md:text-4xl font-bold">50K+</div>
              <div className="text-primary-200">Active Users</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">1000+</div>
              <div className="text-primary-200">Events Monthly</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">25+</div>
              <div className="text-primary-200">Neighborhoods</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
            <button className="bg-white text-primary-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-50 transition-colors shadow-lg focus-visible:ring-2 focus-visible:ring-white">
              Get Started Free
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-primary-600 transition-colors focus-visible:ring-2 focus-visible:ring-white">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Wave Shape */}
      <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full">
          <path
            fill="#f9fafb"
            d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          />
        </svg>
      </div>
    </div>
  );
}
