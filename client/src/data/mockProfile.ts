import type { MockUser, Friend } from '../types';

export const mockUser: MockUser = {
  id: 'u1',
  name: 'Jordan Chen',
  bio: 'Seattle native who loves live music, food tours, and spontaneous adventures. Always looking for the next great event!',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  memberSince: '2025-06-15',
  membershipTier: 'premium',
  eventsAttended: 47,
  friendsCount: 128,
  neighborhood: 'Capitol Hill',
  interests: ['music', 'food-drink', 'nightlife', 'networking'],
};

export const mockFriends: Friend[] = [
  { id: 'f1', name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', mutualEvents: 12 },
  { id: 'f2', name: 'Jamie Park', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', mutualEvents: 8 },
  { id: 'f3', name: 'Morgan Lee', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', mutualEvents: 15 },
  { id: 'f4', name: 'Riley Johnson', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face', mutualEvents: 6 },
  { id: 'f5', name: 'Casey Kim', avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop&crop=face', mutualEvents: 9 },
  { id: 'f6', name: 'Taylor Smith', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', mutualEvents: 3 },
];

export const bookedEventIds = ['1', '5', '6'];
