import { useState, useEffect, useRef } from 'react';
import { X, Search, Check } from 'lucide-react';
import type { SocialUser } from '../types';
import { mockUsers, currentUserFriendIds } from '../data/mockSocial';
import { useToast } from './ToastContainer';

interface FriendPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export default function FriendPickerModal({ isOpen, onClose, eventTitle }: FriendPickerModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toast = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const friends = mockUsers.filter(u => currentUserFriendIds.includes(u.id));
  const filtered = friends.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  // Focus trap and escape handling
  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, input, [tabindex]:not([tabindex="-1"])'
        );
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
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const toggleFriend = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSendInvites = () => {
    if (selected.size === 0) return;
    toast.success(`Invites sent to ${selected.size} friend${selected.size > 1 ? 's' : ''}!`);
    setSelected(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={`Invite friends to ${eventTitle}`}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Invite Friends</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Close invite friends modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search friends..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              aria-label="Search friends to invite"
            />
          </div>
        </div>

        {/* Friend List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2" role="listbox" aria-label="Friends list">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No friends found</p>
          ) : (
            filtered.map(friend => (
              <FriendRow
                key={friend.id}
                friend={friend}
                isSelected={selected.has(friend.id)}
                onToggle={() => toggleFriend(friend.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleSendInvites}
            disabled={selected.size === 0}
            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {selected.size === 0 ? 'Select friends to invite' : `Send Invites (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}

function FriendRow({ friend, isSelected, onToggle }: { friend: SocialUser; isSelected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="option"
      aria-selected={isSelected}
      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left focus-visible:ring-2 focus-visible:ring-primary-500 ${
        isSelected ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      {/* Checkbox */}
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
        isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
      }`}>
        {isSelected && <Check className="w-3.5 h-3.5 text-white" aria-hidden="true" />}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold flex-shrink-0"
           role="img" aria-label={`${friend.name}'s avatar`}>
        {getInitials(friend.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 text-sm">{friend.name}</div>
        <div className="text-xs text-gray-500">{friend.neighborhood}</div>
      </div>
    </button>
  );
}
