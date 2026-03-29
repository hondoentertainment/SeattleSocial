import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ToastContainer';
import Navigation from './components/Navigation';
import DemoBanner from './components/DemoBanner';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import SEOHead from './components/SEOHead';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CalendarPage from './pages/CalendarPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import MyEventsPage from './pages/MyEventsPage';
import MembershipPage from './pages/MembershipPage';
import FriendsPage from './pages/FriendsPage';
import { usePageTracking } from './hooks/usePageTracking';
import { useSimulatedNotifications } from './hooks/useSimulatedNotifications';
import { seedBookings } from './data/mockBookings';

function AppContent() {
  const [notificationCount, setNotificationCount] = useState(3);

  usePageTracking();

  useEffect(() => {
    seedBookings();
  }, []);

  const handleNotification = useCallback(() => {
    setNotificationCount(prev => prev + 1);
  }, []);

  useSimulatedNotifications(handleNotification);

  return (
    <div className="min-h-screen">
      <DemoBanner />
      <Navigation notificationCount={notificationCount} />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-events"
            element={
              <ProtectedRoute>
                <MyEventsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/friends" element={<FriendsPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
