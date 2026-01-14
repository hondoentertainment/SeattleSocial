import { Link } from 'react-router-dom';
import { Calendar, Search, User, Bell, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl">🔥</div>
            <span className="text-2xl font-bold text-primary-600">SeattleSocial</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/events" className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors">
              <Search className="w-5 h-5" />
              <span>Discover</span>
            </Link>
            <Link to="/calendar" className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors">
              <Calendar className="w-5 h-5" />
              <span>My Events</span>
            </Link>
            <Link to="/notifications" className="relative text-gray-700 hover:text-primary-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
            </Link>
          </div>

          {/* User Menu & CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="btn-primary">Upgrade to Premium</button>
            <Link to="/profile" className="text-gray-700 hover:text-primary-600 transition-colors">
              <User className="w-6 h-6" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-3">
            <Link to="/events" className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 py-2">
              <Search className="w-5 h-5" />
              <span>Discover Events</span>
            </Link>
            <Link to="/calendar" className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 py-2">
              <Calendar className="w-5 h-5" />
              <span>My Events</span>
            </Link>
            <Link to="/notifications" className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 py-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </Link>
            <Link to="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 py-2">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>
            <button className="w-full btn-primary mt-4">Upgrade to Premium</button>
          </div>
        </div>
      )}
    </nav>
  );
}
