import { Crown } from 'lucide-react';
import type { MembershipTier } from '../types';

interface PremiumBadgeProps {
  tier: MembershipTier;
  className?: string;
}

export default function PremiumBadge({ tier, className = '' }: PremiumBadgeProps) {
  if (tier === 'free') return null;

  const isPremiumPlus = tier === 'premium-plus';

  return (
    <span
      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
        isPremiumPlus
          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white'
          : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
      } ${className}`}
    >
      <Crown className="w-3.5 h-3.5" />
      <span>{isPremiumPlus ? 'Premium+' : 'Premium'}</span>
    </span>
  );
}
