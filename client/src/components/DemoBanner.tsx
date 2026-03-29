import { useAuth } from '../context/AuthContext';
import { Info } from 'lucide-react';

export default function DemoBanner() {
  const { isDemoMode } = useAuth();

  if (!isDemoMode) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-sm text-amber-800">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span>
          Running in demo mode &mdash; backend is unavailable. Data is simulated.
        </span>
      </div>
    </div>
  );
}
