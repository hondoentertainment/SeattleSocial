import { X, CheckCircle, Info, AlertCircle } from 'lucide-react';
import type { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  info: Info,
  error: AlertCircle,
};

const colorMap = {
  success: 'bg-green-600',
  info: 'bg-primary-600',
  error: 'bg-red-600',
};

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`${colorMap[toast.type]} text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 pointer-events-auto animate-slide-up min-w-[280px]`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              className="hover:opacity-80 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
