import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Edit3,
  Check,
  X,
  Calendar,
  Users,
  Heart,
  Crown,
  Bell,
  Shield,
  Star,
  MapPin,
} from 'lucide-react';
import { mockUser, mockFriends, bookedEventIds } from '../data/mockProfile';
import { mockEvents } from '../data/mockEvents';
import { readSavedEventIds } from '../hooks/useSavedEvents';
import EventCard from '../components/EventCard';
import { useSavedEvents } from '../hooks/useSavedEvents';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Toast';

type Tab = 'events' | 'saved' | 'friends';

const tierLabels: Record<string, { label: string; color: string }> = {
  FREE: { label: 'Free', color: 'bg-gray-200 text-gray-700' },
  PREMIUM: { label: 'Premium', color: 'bg-primary-100 text-primary-700' },
  PREMIUM_PLUS: { label: 'Premium+', color: 'bg-yellow-100 text-yellow-700' },
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(mockUser.displayName);
  const [bio, setBio] = useState(mockUser.bio);
  const [editName, setEditName] = useState(name);
  const [editBio, setEditBio] = useState(bio);

  const [notifEvents, setNotifEvents] = useState(true);
  const [notifFriends, setNotifFriends] = useState(true);
  const [notifFomo, setNotifFomo] = useState(false);

  const { isSaved, toggleSaved } = useSavedEvents();
  const { toasts, addToast, removeToast } = useToast();

  const savedIds = readSavedEventIds();
  const savedEvents = useMemo(() => mockEvents.filter(e => savedIds.includes(e.id)), [savedIds]);
  const bookedEvents = useMemo(() => mockEvents.filter(e => bookedEventIds.includes(e.id)), []);

  const handleToggleSave = (eventId: string) => {
    const wasSaved = isSaved(eventId);
    toggleSaved(eventId);
    addToast(wasSaved ? 'Event removed from saved' : 'Event saved!', 'success');
  };

  const startEdit = () => {
    setEditName(name);
    setEditBio(bio);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = () => {
    setName(editName);
    setBio(editBio);
    setEditing(false);
    addToast('Profile updated!', 'success');
  };

  const tier = tierLabels[mockUser.membershipTier];

  const tabs: { id: Tab; label: string; icon: typeof Calendar }[] = [
    { id: 'events', label: 'My Events', icon: Calendar },
    { id: 'saved', label: 'Saved', icon: Heart },
    { id: 'friends', label: 'Friends', icon: Users },
  ];

  const memberSinceFormatted = new Date(mockUser.memberSince).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={mockUser.avatar}
                alt={name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-primary-100"
              />
              <div className={`absolute -bottom-1 -right-1 ${tier.color} px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1`}>
                <Crown className="w-3 h-3" />
                {tier.label}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-2xl font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full text-gray-600 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="btn-primary text-sm py-2 flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Save
                    </button>
                    <button onClick={cancelEdit} className="btn-secondary text-sm py-2 flex items-center gap-1.5">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                    <button
                      onClick={startEdit}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      aria-label="Edit profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-600 mt-1 max-w-lg">{bio}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 justify-center sm:justify-start">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {mockUser.neighborhood}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Member since {memberSinceFormatted}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 text-center">
            <div className="text-3xl font-bold text-gray-900">{mockUser.eventsAttended}</div>
            <div className="text-sm text-gray-500 mt-1">Events Attended</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 text-center">
            <div className="text-3xl font-bold text-gray-900">{mockUser.friendsCount}</div>
            <div className="text-sm text-gray-500 mt-1">Friends</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 text-center">
            <div className="text-3xl font-bold text-gray-900">{savedIds.length}</div>
            <div className="text-sm text-gray-500 mt-1">Saved Events</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'events' && (
          <div>
            {bookedEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookedEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isSaved={isSaved(event.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>
            ) : (
              <EmptyTab
                icon={<Calendar className="w-16 h-16 text-gray-200" />}
                title="No booked events"
                message="Events you book will appear here."
              />
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div>
            {savedEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isSaved={isSaved(event.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>
            ) : (
              <EmptyTab
                icon={<Heart className="w-16 h-16 text-gray-200" />}
                title="No saved events"
                message="Tap the heart on any event to save it for later."
              />
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockFriends.map(friend => (
              <div
                key={friend.id}
                className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <img
                  src={friend.avatar}
                  alt={friend.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{friend.displayName}</h4>
                  <p className="text-sm text-gray-500">{friend.mutualEvents} mutual events</p>
                </div>
                <User className="w-5 h-5 text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Settings Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Settings
          </h2>

          {/* Notification Preferences */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4" /> Notification Preferences
            </h3>
            <div className="space-y-4">
              <Toggle
                label="Event reminders"
                description="Get notified before events you've booked"
                checked={notifEvents}
                onChange={setNotifEvents}
              />
              <Toggle
                label="Friend activity"
                description="Know when friends RSVP to events"
                checked={notifFriends}
                onChange={setNotifFriends}
              />
              <Toggle
                label="FOMO alerts"
                description="Get notified when events hit high demand"
                checked={notifFomo}
                onChange={setNotifFomo}
              />
            </div>
          </div>

          {/* Membership Upgrade */}
          {mockUser.membershipTier !== 'PREMIUM_PLUS' && (
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Star className="w-6 h-6 text-yellow-300" />
                <h3 className="text-xl font-bold">
                  {mockUser.membershipTier === 'FREE' ? 'Upgrade to Premium' : 'Upgrade to Premium+'}
                </h3>
              </div>
              <p className="text-primary-100 mb-4">
                Get early access to high-demand events, exclusive discounts, and priority booking.
              </p>
              <button className="bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                Learn More
              </button>
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function EmptyTab({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="mx-auto mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{message}</p>
      <Link to="/" className="btn-primary">
        Browse Events
      </Link>
    </div>
  );
}
