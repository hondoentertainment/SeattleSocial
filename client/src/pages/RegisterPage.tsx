import { useState, type FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Touched state for real-time validation
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Mark all as touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!name.trim()) {
      setError('Please enter your display name.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!isPasswordValid) {
      setError(
        'Password must be at least 8 characters with at least one letter and one number.'
      );
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ email, name: name.trim(), password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const ValidationIcon = ({ valid }: { valid: boolean }) =>
    valid ? (
      <Check className="w-4 h-4 text-green-500" />
    ) : (
      <X className="w-4 h-4 text-gray-300" />
    );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <span className="text-3xl">🔥</span>
            <span className="text-3xl font-bold text-primary-600">
              SeattleSocial
            </span>
          </Link>
          <p className="mt-2 text-gray-600">
            Create your account and start discovering events.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-md p-8">
          {error && (
            <div className="mb-6 flex items-start space-x-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Display name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="Your name"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                    touched.name && !name.trim()
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  autoComplete="name"
                />
              </div>
              {touched.name && !name.trim() && (
                <p className="mt-1 text-sm text-red-600">
                  Display name is required.
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                    touched.email && !isValidEmail(email)
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  autoComplete="email"
                />
              </div>
              {touched.email && email && !isValidEmail(email) && (
                <p className="mt-1 text-sm text-red-600">
                  Please enter a valid email address.
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Create a password"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                    touched.password && !isPasswordValid
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  autoComplete="new-password"
                />
              </div>
              {/* Password requirements */}
              {(touched.password || password.length > 0) && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center space-x-2 text-sm">
                    <ValidationIcon valid={hasMinLength} />
                    <span
                      className={
                        hasMinLength ? 'text-green-600' : 'text-gray-500'
                      }
                    >
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <ValidationIcon valid={hasLetter} />
                    <span
                      className={
                        hasLetter ? 'text-green-600' : 'text-gray-500'
                      }
                    >
                      Contains a letter
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <ValidationIcon valid={hasNumber} />
                    <span
                      className={
                        hasNumber ? 'text-green-600' : 'text-gray-500'
                      }
                    >
                      Contains a number
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Confirm your password"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                    touched.confirmPassword &&
                    confirmPassword &&
                    !passwordsMatch
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  autoComplete="new-password"
                />
              </div>
              {touched.confirmPassword &&
                confirmPassword &&
                !passwordsMatch && (
                  <p className="mt-1 text-sm text-red-600">
                    Passwords do not match.
                  </p>
                )}
            </div>

            {/* Terms */}
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">
                I agree to the{' '}
                <a
                  href="#"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="#"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              <span>
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </span>
            </button>
          </form>
        </div>

        {/* Login Link */}
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-600 font-semibold hover:text-primary-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
