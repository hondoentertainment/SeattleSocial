import { useState, useCallback } from 'react';

const STORAGE_KEY = 'seattlesocial_saved_events';

function getSavedIds(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useSavedEvents() {
  const [savedIds, setSavedIds] = useState<string[]>(getSavedIds);

  const toggleSaved = useCallback((eventId: string) => {
    setSavedIds(prev => {
      const next = prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isSaved = useCallback((eventId: string) => {
    return savedIds.includes(eventId);
  }, [savedIds]);

  return { savedIds, toggleSaved, isSaved };
}

/** Static read for components that just need the list once */
export function readSavedEventIds(): string[] {
  return getSavedIds();
}
