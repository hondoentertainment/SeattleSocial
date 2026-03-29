import { Link } from 'react-router-dom';
import { SearchX, Home, Calendar } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-100 mb-6">
            <SearchX className="w-12 h-12 text-primary-600" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-3">Page not found</h2>
          <p className="text-gray-500 text-lg">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 btn-primary text-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Go back home
          </Link>

          <div className="bg-white rounded-xl shadow-md p-6 text-left">
            <div className="flex items-center space-x-3 mb-3">
              <Calendar className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Looking for events?</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Discover the hottest events happening in Seattle right now.
            </p>
            <Link
              to="/events"
              className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
            >
              Browse all events &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
