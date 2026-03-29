import { useState, useEffect, useRef, useCallback } from 'react';
import { X, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { Event } from '../types';

interface CheckoutModalProps {
  open: boolean;
  event: Event;
  ticketCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

type CheckoutState = 'form' | 'processing' | 'success' | 'error';

/** Outer wrapper: only mounts the inner modal when open, so state resets naturally */
export default function CheckoutModal(props: CheckoutModalProps) {
  if (!props.open) return null;
  return <CheckoutModalInner {...props} />;
}

function CheckoutModalInner({
  event,
  ticketCount,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [state, setState] = useState<CheckoutState>('form');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  const subtotal = event.price * ticketCount;
  const serviceFee = Math.round(subtotal * 0.1 * 100) / 100;
  const total = Math.round((subtotal + serviceFee) * 100) / 100;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state !== 'processing') onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose, state]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setState('processing');
    // Simulate payment processing
    setTimeout(() => {
      setState('success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 1500);
  };

  const handleRetry = () => {
    setState('form');
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => state !== 'processing' && onClose()}
    >
      <div className="fixed inset-0 bg-black/50 transition-opacity" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 z-10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
          {state !== 'processing' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Success State */}
        {state === 'success' && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h3>
            <p className="text-gray-600 mb-4">
              Your booking for <span className="font-semibold">{event.title}</span> is confirmed.
            </p>
            <p className="text-sm text-gray-500">
              {ticketCount} ticket{ticketCount > 1 ? 's' : ''} - ${total.toFixed(2)} total
            </p>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800">Payment failed</h4>
                <p className="text-sm text-red-700 mt-1">
                  Your card was declined. Please check your details and try again.
                </p>
              </div>
            </div>
            <button onClick={handleRetry} className="w-full btn-primary py-3">
              Try Again
            </button>
          </div>
        )}

        {/* Processing State */}
        {state === 'processing' && (
          <div className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Processing Payment...
            </h3>
            <p className="text-gray-600">Please do not close this window.</p>
          </div>
        )}

        {/* Form State */}
        {state === 'form' && (
          <form onSubmit={handleSubmit}>
            {/* Order Summary */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{event.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {ticketCount} x ${event.price.toFixed(2)}
                  </span>
                  <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service fee (10%)</span>
                  <span className="text-gray-900">${serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-base">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment Details</span>
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVC
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cvc}
                    onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full btn-primary text-lg py-4 mt-2"
              >
                Pay ${total.toFixed(2)}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Your payment info is secure. This is a demo checkout.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
