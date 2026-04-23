import { Link, useLocation } from 'react-router-dom';
import { Calendar, Search, User, Bell, Menu, X, LayoutDashboard, Bookmark } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import AuthModal from './AuthModal';

export default function Navigation() {
  const { user, unreadCount, isAuthLoading } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const location = useLocation();

  const openLogin = () => { setAuthMode('login'); setShowAuth(true); setMobileMenuOpen(false); };
  const openRegister = () => { setAuthMode('register'); setShowAuth(true); setMobileMenuOpen(false); };

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `flex items-center space-x-1 transition-colors font-medium ${
      isActive(path) ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
    }`;

  const initial = user?.name.charAt(0).toUpperCase();

  return (
    <>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultMode={authMode} />}

      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl">🔥</div>
              <span className="text-2xl font-bold text-primary-600">SeattleSocial</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/events" className={navLinkClass('/events')}>
                <Search className="w-5 h-5" />
                <span>Discover</span>
              </Link>
              {user && (
                <Link to="/calendar" className={navLinkClass('/calendar')}>
                  <Calendar className="w-5 h-5" />
                  <span>My Events</span>
                </Link>
              )}
              {user && (
                <Link to="/saved" className={navLinkClass('/saved')}>
                  <Bookmark className="w-5 h-5" />
                  <span>Saved</span>
                </Link>
              )}
              {user && (
                <Link to="/notifications" className={`relative ${navLinkClass('/notifications')}`}>
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center space-x-3">
              {isAuthLoading ? (
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              ) : user ? (
                <>
                  <Link to="/organizer"
                    className="flex items-center space-x-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Organize</span>
                  </Link>
                  <Link to="/profile"
                    className="flex items-center space-x-2 bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full transition-colors">
                    <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {initial}
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                  </Link>
                </>
              ) : (
                <>
                  <button onClick={openLogin} className="text-gray-700 hover:text-primary-600 font-medium transition-colors text-sm">
                    Sign In
                  </button>
                  <button onClick={openRegister} className="btn-primary text-sm py-2">
                    Join Free
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-gray-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              <MobileLink to="/events" icon={<Search className="w-5 h-5" />} label="Discover Events" onClose={() => setMobileMenuOpen(false)} />
              {user && <MobileLink to="/calendar" icon={<Calendar className="w-5 h-5" />} label="My Events" onClose={() => setMobileMenuOpen(false)} />}
              {user && <MobileLink to="/saved" icon={<Bookmark className="w-5 h-5" />} label="Saved Events" onClose={() => setMobileMenuOpen(false)} />}
              {user && (
                <MobileLink to="/notifications" onClose={() => setMobileMenuOpen(false)}
                  icon={
                    <div className="relative">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3.5 h-3.5 flex items-center justify-center">{unreadCount}</span>}
                    </div>
                  }
                  label="Notifications" />
              )}
              {user && <MobileLink to="/organizer" icon={<LayoutDashboard className="w-5 h-5" />} label="Organizer Dashboard" onClose={() => setMobileMenuOpen(false)} />}
              <MobileLink to="/profile" icon={<User className="w-5 h-5" />} label={user ? user.name : 'Profile'} onClose={() => setMobileMenuOpen(false)} />

              {!user && (
                <div className="pt-3 space-y-2 border-t border-gray-100 mt-2">
                  <button onClick={openLogin} className="w-full btn-secondary py-3">Sign In</button>
                  <button onClick={openRegister} className="w-full btn-primary py-3">Join Free 🎉</button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

function MobileLink({
  to, icon, label, onClose
}: { to: string; icon: React.ReactNode; label: string; onClose: () => void }) {
  return (
    <Link to={to} onClick={onClose}
      className="flex items-center space-x-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 px-3 py-2.5 rounded-lg transition-colors">
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
