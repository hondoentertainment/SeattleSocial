import type { SocialUser, FriendStatus } from '../types';
import { UserPlus, Check, Clock, Crown, Users } from 'lucide-react';

interface FriendCardProps {
  user: SocialUser;
  status: FriendStatus;
  onAction?: (userId: string, action: 'add' | 'accept' | 'decline' | 'view') => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

const tierColors: Record<string, string> = {
  premium: 'bg-yellow-100 text-yellow-800',
  'premium-plus': 'bg-purple-100 text-purple-800',
};

export default function FriendCard({ user, status, onAction }: FriendCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
      {/* Avatar */}
      <div className="relative mb-3">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={`${user.name}'s avatar`}
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold"
            role="img"
            aria-label={`${user.name}'s avatar`}
          >
            {getInitials(user.name)}
          </div>
        )}
        {user.membershipTier !== 'free' && (
          <span
            className="absolute -top-1 -right-1 p-1 bg-white rounded-full shadow"
            aria-label={`${user.membershipTier} member`}
          >
            <Crown className="w-4 h-4 text-yellow-500" />
          </span>
        )}
      </div>

      {/* Name & badge */}
      <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
      {user.membershipTier !== 'free' && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${tierColors[user.membershipTier]}`}>
          {user.membershipTier === 'premium-plus' ? 'Premium+' : 'Premium'}
        </span>
      )}

      {/* Neighborhood */}
      <p className="text-sm text-gray-500 mt-1">{user.neighborhood}</p>

      {/* Mutual friends */}
      <div className="flex items-center space-x-1 text-sm text-gray-600 mt-2">
        <Users className="w-4 h-4" aria-hidden="true" />
        <span>{user.mutualFriends} mutual friends</span>
      </div>

      {/* Last event together */}
      {user.lastEventTogether && (
        <p className="text-xs text-gray-400 mt-1 truncate max-w-full">
          Last event: {user.lastEventTogether}
        </p>
      )}

      {/* Action button */}
      <div className="mt-4 w-full">
        {status === 'friends' && (
          <button
            onClick={() => onAction?.(user.id, 'view')}
            className="w-full btn-secondary text-sm py-2 focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            View Profile
          </button>
        )}
        {status === 'pending-outgoing' && (
          <button
            disabled
            className="w-full px-4 py-2 bg-gray-100 text-gray-500 font-semibold rounded-lg text-sm flex items-center justify-center space-x-1 cursor-not-allowed"
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>Pending</span>
          </button>
        )}
        {status === 'pending-incoming' && (
          <div className="flex space-x-2">
            <button
              onClick={() => onAction?.(user.id, 'accept')}
              className="flex-1 btn-primary text-sm py-2 flex items-center justify-center space-x-1 focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label={`Accept friend request from ${user.name}`}
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>Accept</span>
            </button>
            <button
              onClick={() => onAction?.(user.id, 'decline')}
              className="flex-1 btn-secondary text-sm py-2 focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label={`Decline friend request from ${user.name}`}
            >
              Decline
            </button>
          </div>
        )}
        {status === 'none' && (
          <button
            onClick={() => onAction?.(user.id, 'add')}
            className="w-full btn-primary text-sm py-2 flex items-center justify-center space-x-1 focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={`Send friend request to ${user.name}`}
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            <span>Add Friend</span>
          </button>
        )}
      </div>
    </div>
  );
}
