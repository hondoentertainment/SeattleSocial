import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

type State = 'verifying' | 'success' | 'error';

export default function MagicLinkVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useApp();
  const [state, setState] = useState<State>('verifying');
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('No token found in the link. Please request a new sign-in link.');
      setState('error');
      return;
    }

    api.auth.verifyMagicLink(token)
      .then(({ token: jwt, user, isNewUser: newUser }) => {
        login(jwt, user);
        setIsNewUser(newUser);
        setState('success');
        // Redirect after a short delay so the user sees the success message
        setTimeout(() => navigate(newUser ? '/profile' : '/'), 2000);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Verification failed');
        setState('error');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center">
        {state === 'verifying' && (
          <>
            <Loader className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Signing you in…</h2>
            <p className="text-gray-500 text-sm">Verifying your magic link, please wait.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isNewUser ? 'Welcome to SeattleSocial! 🎉' : "You're signed in!"}
            </h2>
            <p className="text-gray-500 text-sm">
              {isNewUser
                ? "Your account has been created. Redirecting to your profile so you can set it up…"
                : 'Redirecting you back to the app…'}
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-9 h-9 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Link invalid</h2>
            <p className="text-red-600 text-sm mb-6">{error}</p>
            <Link to="/" className="btn-primary inline-block">
              Back to home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
