import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import type { Toast, ToastType } from '../types';

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  addToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalId = 0;

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Return no-op fallback if used outside provider (for initial render safety)
    return {
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
      addToast: () => {},
    };
  }
  return ctx;
}

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 5000;

const iconMap: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="w-5 h-5" aria-hidden="true" />,
  error: <AlertCircle className="w-5 h-5" aria-hidden="true" />,
  info: <Info className="w-5 h-5" aria-hidden="true" />,
  warning: <AlertTriangle className="w-5 h-5" aria-hidden="true" />,
};

const colorMap: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
};

const iconColorMap: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${++globalId}`;
    const newToast: Toast = { id, type, message };

    setToasts(prev => {
      const next = [...prev, newToast];
      // Keep only the last MAX_TOASTS
      if (next.length > MAX_TOASTS) {
        const removed = next.shift();
        if (removed) {
          const timer = timersRef.current.get(removed.id);
          if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(removed.id);
          }
        }
      }
      return next;
    });

    const timer = setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const value: ToastContextValue = {
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    info: (msg) => addToast('info', msg),
    warning: (msg) => addToast('warning', msg),
    addToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 w-full max-w-sm"
        aria-live="polite"
        aria-label="Notifications"
        role="region"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-start space-x-3 p-4 rounded-lg border shadow-lg animate-slide-in ${colorMap[toast.type]}`}
            role="alert"
          >
            <span className={`flex-shrink-0 ${iconColorMap[toast.type]}`}>
              {iconMap[toast.type]}
            </span>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
