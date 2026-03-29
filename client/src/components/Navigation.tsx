import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  Search,
  User,
  Bell,
  Menu,
  X,
  LogIn,
  UserPlus,
  LogOut,
  Bookmark,
  Settings,
  ChevronDown,
  Crown,
  Users,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import PremiumBadge from './PremiumBadge';

interface NavigationProps {
  notificationCount?: number;
}

export default function Navigation({ notificationCount = 0 }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tierLabel: Record<string, string> = {
    free: 'Free',
    premium: 'Premium',
    'premium-plus': 'Premium+',
  };

  const tierColor: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    premium: 'bg-primary-100 text-primary-700',
    'premium-plus': 'bg-amber-100 text-amber-700',
  };

  const membershipTier = user?.membershipTier || 'free';
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

  // Active route styling (from agent 2)
  const isActive = (path: string) => {
    if (path === '/events') return location.pathname === '/' || location.pathname === '/events';
    return location.pathname === path;
  };

  const linkClass = (path: string) =>
    `flex items-center space-x-1 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 rounded ${
      isActive(path)
        ? 'text-primary-600 font-semibold'
        : 'text-gray-700 hover:text-primary-600'
    }`;

  const mobileLinkClass = (path: string) =>
    `flex items-center space-x-2 py-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 rounded ${
      isActive(path)
        ? 'text-primary-600 font-semibold'
        : 'text-gray-700 hover:text-primary-600'
    }`;

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50" aria-label="Main navigation">
      {/* Skip to content link (from agent 5) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo with PremiumBadge (from agent 4) */}
          <Link
            to="/"
            className="flex items-center space-x-2 focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
            aria-label="SeattleSocial home"
            onClick={closeMobile}
          >
            <div className="text-2xl" aria-hidden="true">🔥</div>
            <span className="text-2xl font-bold text-primary-600">SeattleSocial</span>
            {isAuthenticated && <PremiumBadge tier={membershipTier} />}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/events" className={linkClass('/events')}>
              <Search className="w-5 h-5" aria-hidden="true" />
              <span>Discover</span>
            </Link>
            {isAuthenticated && (
              <Link to="/friends" className={linkClass('/friends')}>
                <Users className="w-5 h-5" aria-hidden="true" />
                <span>Friends</span>
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/my-events" className={linkClass('/my-events')}>
                <Calendar className="w-5 h-5" aria-hidden="true" />
                <span>My Events</span>
              </Link>
            )}
            {isAuthenticated && (
              <Link
                to="/notifications"
                className={`relative ${linkClass('/notifications')}`}
                aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {notificationCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
                    aria-hidden="true"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Dynamic CTA based on tier (from agent 4) */}
                {membershipTier === 'free' ? (
                  <Link
                    to="/membership"
                    className="btn-primary flex items-center space-x-1 text-sm py-2 focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Upgrade to Premium</span>
                  </Link>
                ) : (
                  <Link
                    to="/membership"
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                  >
                    Manage Plan
                  </Link>
                )}

                {/* User Dropdown (from agent 3) */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    {user?.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
                        {userInitial}
                      </div>
                    )}
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  </button>

                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                      role="menu"
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        role="menuitem"
                      >
                        <User className="w-4 h-4" aria-hidden="true" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/my-events"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        role="menuitem"
                      >
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        <span>My Events</span>
                      </Link>
                      <Link
                        to="/saved"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        role="menuitem"
                      >
                        <Bookmark className="w-4 h-4" aria-hidden="true" />
                        <span>Saved Events</span>
                      </Link>
                      <Link
                        to="/friends"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        role="menuitem"
                      >
                        <Users className="w-4 h-4" aria-hidden="true" />
                        <span>Friends</span>
                      </Link>

                      {/* Membership tier badge */}
                      <div className="border-t border-gray-100 my-1" />
                      <div className="px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <Crown className="w-4 h-4 text-amber-500" aria-hidden="true" />
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              tierColor[membershipTier]
                            }`}
                          >
                            {tierLabel[membershipTier]}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 my-1" />

                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        role="menuitem"
                      >
                        <Settings className="w-4 h-4" aria-hidden="true" />
                        <span>Settings</span>
                      </Link>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors font-medium focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                >
                  <LogIn className="w-5 h-5" aria-hidden="true" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm py-2 focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <span className="flex items-center space-x-1">
                    <UserPlus className="w-4 h-4" aria-hidden="true" />
                    <span>Sign Up</span>
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 p-1 focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200" role="menu">
          <div className="px-4 py-4 space-y-3">
            <Link
              to="/events"
              className={mobileLinkClass('/events')}
              role="menuitem"
              onClick={closeMobile}
            >
              <Search className="w-5 h-5" aria-hidden="true" />
              <span>Discover Events</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/friends"
                  className={mobileLinkClass('/friends')}
                  role="menuitem"
                  onClick={closeMobile}
                >
                  <Users className="w-5 h-5" aria-hidden="true" />
                  <span>Friends</span>
                </Link>
                <Link
                  to="/my-events"
                  className={mobileLinkClass('/my-events')}
                  role="menuitem"
                  onClick={closeMobile}
                >
                  <Calendar className="w-5 h-5" aria-hidden="true" />
                  <span>My Events</span>
                </Link>
                <Link
                  to="/notifications"
                  className={mobileLinkClass('/notifications')}
                  role="menuitem"
                  onClick={closeMobile}
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  <span>Notifications</span>
                  {notificationCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-auto" aria-hidden="true">
                      {notificationCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/profile"
                  className={mobileLinkClass('/profile')}
                  role="menuitem"
                  onClick={closeMobile}
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                  <span>Profile</span>
                </Link>
                <Link
                  to="/saved"
                  className={mobileLinkClass('/saved')}
                  role="menuitem"
                  onClick={closeMobile}
                >
                  <Bookmark className="w-5 h-5" aria-hidden="true" />
                  <span>Saved Events</span>
                </Link>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <Crown className="w-4 h-4 text-amber-500" aria-hidden="true" />
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        tierColor[membershipTier]
                      }`}
                    >
                      {tierLabel[membershipTier]} Member
                    </span>
                  </div>
                  {membershipTier === 'free' ? (
                    <Link
                      to="/membership"
                      className="w-full btn-primary mb-3 flex items-center justify-center space-x-1"
                      onClick={closeMobile}
                    >
                      <Crown className="w-4 h-4" />
                      <span>Upgrade to Premium</span>
                    </Link>
                  ) : (
                    <Link
                      to="/membership"
                      className="block text-sm font-semibold text-primary-600 hover:text-primary-700 mb-3"
                      onClick={closeMobile}
                    >
                      Manage Plan
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      closeMobile();
                      logout();
                    }}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700 py-2 w-full"
                    role="menuitem"
                  >
                    <LogOut className="w-5 h-5" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t border-gray-200 pt-3 space-y-3">
                <Link
                  to="/login"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 py-2"
                  role="menuitem"
                  onClick={closeMobile}
                >
                  <LogIn className="w-5 h-5" aria-hidden="true" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="block"
                  role="menuitem"
                  onClick={closeMobile}
                >
                  <button className="w-full btn-primary">Sign Up Free</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
