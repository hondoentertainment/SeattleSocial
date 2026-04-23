import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

interface SSEEvent {
  type: string;
  [key: string]: unknown;
}

export function useSSE(onEvent?: (e: SSEEvent) => void) {
  const { token } = useApp();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token) return;

    // Pass JWT via query param (EventSource doesn't support headers)
    const url = `/api/sse/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const parsed: SSEEvent = JSON.parse(e.data);
        onEvent?.(parsed);
      } catch { /* malformed frame */ }
    };

    es.onerror = () => {
      // Browser auto-reconnects on error; close on unmount only
    };

    return () => { es.close(); esRef.current = null; };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
}
