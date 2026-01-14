import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events" element={<HomePage />} />
          <Route path="/calendar" element={<ComingSoon page="My Events Calendar" />} />
          <Route path="/notifications" element={<ComingSoon page="Notifications" />} />
          <Route path="/profile" element={<ComingSoon page="Profile" />} />
        </Routes>
      </div>
    </Router>
  );
}

function ComingSoon({ page }: { page: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{page}</h1>
        <p className="text-xl text-gray-600 mb-8">Coming soon! This feature is under development.</p>
        <a href="/" className="btn-primary">
          Back to Home
        </a>
      </div>
    </div>
  );
}

export default App;
