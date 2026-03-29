import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '../components/ToastContainer';
import { mockEvents } from '../data/mockEvents';
import { mockUsers, currentUserFriendIds } from '../data/mockSocial';

export function useSimulatedNotifications(
  onNotification?: () => void,
): void {
  const toast = useToast();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const friends = mockUsers.filter(u => currentUserFriendIds.includes(u.id));

  const generateNotification = useCallback(() => {
    const types = ['fomo-spike', 'friend-rsvp', 'event-reminder'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    const event = mockEvents[Math.floor(Math.random() * mockEvents.length)];
    const friend = friends[Math.floor(Math.random() * friends.length)];

    switch (type) {
      case 'fomo-spike':
        toast.warning(
          `${event.title} just hit ${event.fomoScore} FOMO! Only ${event.capacity - event.ticketsSold} spots left`
        );
        break;
      case 'friend-rsvp':
        toast.info(
          `${friend.name} is going to ${event.title}`
        );
        break;
      case 'event-reminder':
        toast.info(
          `${event.title} starts in 2 hours`
        );
        break;
    }

    onNotification?.();
  }, [toast, friends, onNotification]);

  useEffect(() => {
    const schedule = () => {
      const delay = 30000 + Math.random() * 30000; // 30-60 seconds
      timerRef.current = setTimeout(() => {
        generateNotification();
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [generateNotification]);
}
