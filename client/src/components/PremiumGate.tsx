import { useState, type ReactNode } from 'react';
import { Lock, Crown, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMembershipTier } from '../utils/storage';
import type { MembershipTier } from '../types';

interface PremiumGateProps {
  requiredTier?: MembershipTier;
  children: ReactNode;
  featureName?: string;
}

export default function PremiumGate({
  requiredTier = 'PREMIUM',
  children,
  featureName = 'This feature',
}: PremiumGateProps) {
  const [showUpsell, setShowUpsell] = useState(false);
  const currentTier = getMembershipTier();

  const tierRank: Record<MembershipTier, number> = {
    FREE: 0,
    PREMIUM: 1,
    PREMIUM_PLUS: 2,
  };

  if (tierRank[currentTier] >= tierRank[requiredTier]) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        className="relative cursor-pointer group"
        onClick={() => setShowUpsell(true)}
      >
        <div className="opacity-50 pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center space-x-1.5 bg-gray-900/80 text-white px-3 py-1.5 rounded-full text-sm font-semibold group-hover:bg-primary-600 transition-colors">
            <Lock className="w-3.5 h-3.5" />
            <span>{requiredTier === 'PREMIUM_PLUS' ? 'Premium+' : 'Premium'}</span>
          </div>
        </div>
      </div>

      {showUpsell && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowUpsell(false)}
        >
          <div className="fixed inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 z-10 text-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowUpsell(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Upgrade to Unlock
            </h3>
            <p className="text-gray-600 mb-6">
              {featureName} requires a{' '}
              {requiredTier === 'PREMIUM_PLUS' ? 'Premium+' : 'Premium'}{' '}
              membership. Upgrade now to access this and many more exclusive features.
            </p>
            <Link
              to="/membership"
              className="inline-block w-full btn-primary text-lg py-3"
              onClick={() => setShowUpsell(false)}
            >
              View Membership Plans
            </Link>
            <button
              onClick={() => setShowUpsell(false)}
              className="mt-3 text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
