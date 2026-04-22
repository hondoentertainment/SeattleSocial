import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

interface AuthModalProps {
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export default function AuthModal({ onClose, defaultMode = 'login' }: AuthModalProps) {
  const { login } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', neighborhood: '' });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = mode === 'login'
        ? await api.auth.login({ email: form.email, password: form.password })
        : await api.auth.register(form);
      login(result.token, result.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const neighborhoods = [
    'Ballard', 'Belltown', 'Capitol Hill', 'Downtown', 'Eastlake',
    'Fremont', 'Georgetown', 'Pioneer Square', 'Queen Anne',
    'Rainier Beach', 'SODO', 'South Lake Union', 'University District'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔥</div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Welcome back!' : 'Join SeattleSocial'}
          </h2>
          <p className="text-gray-500 mt-1">
            {mode === 'login' ? "Sign in to your account" : "Your first event is on us 🎉"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text" required value={form.name} onChange={set('name')}
                placeholder="Alex Smith"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required value={form.email} onChange={set('email')}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood (optional)</label>
              <select value={form.neighborhood} onChange={set('neighborhood')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                <option value="">Select your neighborhood</option>
                {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full btn-primary py-4 text-lg disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button onClick={() => { setMode('register'); setError(''); }} className="text-primary-600 font-semibold hover:underline">
                Sign up free
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); }} className="text-primary-600 font-semibold hover:underline">
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
