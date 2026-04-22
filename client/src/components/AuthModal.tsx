import { useState } from 'react';
import { X, Eye, EyeOff, Zap, Mail, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

interface AuthModalProps {
  onClose: () => void;
  defaultMode?: 'login' | 'register' | 'magic';
}

type Mode = 'login' | 'register' | 'magic';

const NEIGHBORHOODS = [
  'Ballard', 'Belltown', 'Capitol Hill', 'Downtown', 'Eastlake',
  'Fremont', 'Georgetown', 'Pioneer Square', 'Queen Anne',
  'Rainier Beach', 'SODO', 'South Lake Union', 'University District'
];

export default function AuthModal({ onClose, defaultMode = 'magic' }: AuthModalProps) {
  const { login } = useApp();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', neighborhood: '' });

  // Magic link specific state
  const [magicSent, setMagicSent] = useState(false);
  const [demoUrl, setDemoUrl] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const switchMode = (next: Mode) => { setMode(next); setError(''); setMagicSent(false); setDemoUrl(''); };

  // --- Password sign-in / register ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

  // --- Magic link send ---
  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.auth.sendMagicLink(form.email);
      setMagicSent(true);
      if (result.demoUrl) setDemoUrl(result.demoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔥</div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'register' ? 'Join SeattleSocial' : 'Welcome back!'}
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            {mode === 'register' ? 'Your first event is on us 🎉' : 'Sign in to your account'}
          </p>
        </div>

        {/* Tab switcher — magic vs password */}
        <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50">
          <TabButton active={mode === 'magic'} onClick={() => switchMode('magic')} icon={<Zap className="w-4 h-4" />} label="Magic Link" />
          <TabButton active={mode === 'login'} onClick={() => switchMode('login')} icon={<Mail className="w-4 h-4" />} label="Password" />
        </div>

        {/* ── Magic Link flow ── */}
        {mode === 'magic' && (
          magicSent ? (
            <MagicSentView
              email={form.email}
              demoUrl={demoUrl}
              onResend={() => { setMagicSent(false); setDemoUrl(''); }}
            />
          ) : (
            <form onSubmit={handleMagicSubmit} className="space-y-4">
              <p className="text-sm text-gray-600 bg-primary-50 border border-primary-100 rounded-lg px-4 py-3">
                Enter your email and we'll send a one-click sign-in link — no password needed. New users are signed up automatically.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email" required value={form.email} onChange={set('email')}
                  placeholder="you@example.com" autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {error && <ErrorBox message={error} />}

              <button type="submit" disabled={loading}
                className="w-full btn-primary py-4 text-lg disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? 'Sending...' : <><Zap className="w-5 h-5" /> Send Magic Link</>}
              </button>
            </form>
          )
        )}

        {/* ── Password login ── */}
        {mode === 'login' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={form.email} onChange={set('email')}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <ErrorBox message={error} />}

            <button type="submit" disabled={loading}
              className="w-full btn-primary py-4 text-lg disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <button type="button" onClick={() => switchMode('register')}
                className="text-primary-600 font-semibold hover:underline">
                Create one
              </button>
            </p>
          </form>
        )}

        {/* ── Register ── */}
        {mode === 'register' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" required value={form.name} onChange={set('name')}
                placeholder="Alex Smith"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={form.email} onChange={set('email')}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood (optional)</label>
              <select value={form.neighborhood} onChange={set('neighborhood')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                <option value="">Select your neighborhood</option>
                {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {error && <ErrorBox message={error} />}

            <button type="submit" disabled={loading}
              className="w-full btn-primary py-4 text-lg disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')}
                className="text-primary-600 font-semibold hover:underline">Sign in</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} type="button"
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-semibold transition-all ${
        active ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}>
      {icon}{label}
    </button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{message}</div>
  );
}

function MagicSentView({ email, demoUrl, onResend }: { email: string; demoUrl: string; onResend: () => void }) {
  return (
    <div className="text-center py-2">
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Check your inbox!</h3>
      <p className="text-gray-600 text-sm mb-4">
        We sent a sign-in link to <span className="font-semibold text-gray-900">{email}</span>.
        It expires in 15 minutes.
      </p>

      {demoUrl && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-left">
          <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Demo mode — no SMTP configured
          </p>
          <p className="text-xs text-amber-700 mb-2">Click the link below to complete sign-in:</p>
          <a href={demoUrl}
            className="text-xs text-primary-600 hover:underline break-all font-mono">
            {demoUrl}
          </a>
        </div>
      )}

      <p className="text-sm text-gray-500 mt-2">
        Didn't receive it?{' '}
        <button onClick={onResend} className="text-primary-600 font-semibold hover:underline">
          Try again
        </button>
      </p>
    </div>
  );
}
