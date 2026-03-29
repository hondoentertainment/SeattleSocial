import type { SocialUser, FriendRequest, FriendsGoingData } from '../types';

export const mockUsers: SocialUser[] = [
  {
    id: 'u1',
    displayName: 'Alex Chen',
    avatarUrl: undefined,
    neighborhood: 'Capitol Hill',
    membershipTier: 'PREMIUM',
    mutualFriends: 5,
    lastEventTogether: 'Indie Night at Neumos',
    eventsAttended: 24,
  },
  {
    id: 'u2',
    displayName: 'Jordan Rivera',
    avatarUrl: undefined,
    neighborhood: 'Ballard',
    membershipTier: 'FREE',
    mutualFriends: 3,
    lastEventTogether: 'Pike Place Food Tour',
    eventsAttended: 12,
  },
  {
    id: 'u3',
    displayName: 'Sam Nakamura',
    avatarUrl: undefined,
    neighborhood: 'Fremont',
    membershipTier: 'PREMIUM_PLUS',
    mutualFriends: 8,
    lastEventTogether: 'Fremont Friday Night Art Walk',
    eventsAttended: 31,
  },
  {
    id: 'u4',
    displayName: 'Taylor Okafor',
    avatarUrl: undefined,
    neighborhood: 'Queen Anne',
    membershipTier: 'PREMIUM',
    mutualFriends: 2,
    lastEventTogether: 'Sunset Yoga at Kerry Park',
    eventsAttended: 18,
  },
  {
    id: 'u5',
    displayName: 'Morgan Patel',
    avatarUrl: undefined,
    neighborhood: 'Georgetown',
    membershipTier: 'FREE',
    mutualFriends: 6,
    lastEventTogether: 'Electronic Music Showcase',
    eventsAttended: 9,
  },
  {
    id: 'u6',
    displayName: 'Casey Lindgren',
    avatarUrl: undefined,
    neighborhood: 'Wallingford',
    membershipTier: 'PREMIUM',
    mutualFriends: 4,
    lastEventTogether: 'Craft Beer & Trivia Night',
    eventsAttended: 22,
  },
  {
    id: 'u7',
    displayName: 'Riley Tanaka',
    avatarUrl: undefined,
    neighborhood: 'SODO',
    membershipTier: 'FREE',
    mutualFriends: 1,
    lastEventTogether: undefined,
    eventsAttended: 5,
  },
  {
    id: 'u8',
    displayName: 'Dakota Yeboah',
    avatarUrl: undefined,
    neighborhood: 'Beacon Hill',
    membershipTier: 'PREMIUM_PLUS',
    mutualFriends: 7,
    lastEventTogether: 'Tech Startup Networking Mixer',
    eventsAttended: 27,
  },
];

// Current user's friends (by id)
export const currentUserFriendIds = ['u1', 'u2', 'u3', 'u4', 'u5'];

export const mockFriendRequests: FriendRequest[] = [
  {
    id: 'fr1',
    from: mockUsers[5], // Casey
    to: mockUsers[0], // current user placeholder
    createdAt: '2026-03-28T10:00:00',
    status: 'PENDING',
  },
  {
    id: 'fr2',
    from: mockUsers[7], // Dakota
    to: mockUsers[0],
    createdAt: '2026-03-27T14:30:00',
    status: 'PENDING',
  },
  {
    id: 'fr3',
    from: mockUsers[0],
    to: mockUsers[6], // Riley (outgoing)
    createdAt: '2026-03-26T09:00:00',
    status: 'PENDING',
  },
];

export const mockFriendsGoingData: FriendsGoingData[] = [
  {
    eventId: '1',
    friends: [mockUsers[0], mockUsers[2], mockUsers[4], mockUsers[3], mockUsers[1]],
  },
  {
    eventId: '2',
    friends: [mockUsers[1], mockUsers[3]],
  },
  {
    eventId: '3',
    friends: [mockUsers[2], mockUsers[0], mockUsers[4]],
  },
  {
    eventId: '4',
    friends: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4], mockUsers[5], mockUsers[6], mockUsers[7]],
  },
  {
    eventId: '5',
    friends: [mockUsers[0], mockUsers[2], mockUsers[3], mockUsers[4], mockUsers[5], mockUsers[7], mockUsers[1]],
  },
  {
    eventId: '6',
    friends: [mockUsers[3]],
  },
  {
    eventId: '7',
    friends: [mockUsers[0], mockUsers[2], mockUsers[5], mockUsers[4]],
  },
  {
    eventId: '9',
    friends: [mockUsers[0], mockUsers[2], mockUsers[4], mockUsers[1], mockUsers[5], mockUsers[7]],
  },
  {
    eventId: '10',
    friends: [mockUsers[3]],
  },
];

// Discover suggestions (non-friends who share event attendance)
export const discoverSuggestions: SocialUser[] = [
  mockUsers[5], // Casey
  mockUsers[6], // Riley
  mockUsers[7], // Dakota
];
