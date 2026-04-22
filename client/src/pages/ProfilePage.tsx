import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Edit2, MapPin, Calendar, Star, Crown, Save, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import AuthModal from '../components/AuthModal';
import type { EventCategory } from '../types';

const TIER_INFO = {
  free: { label: 'Free', color: 'bg-gray-200 text-gray-800', icon: '🎟️', price: '$0' },
  premium: { label: 'Premium', color: 'bg-primary-100 text-primary-800', icon: '⭐', price: '$14.99/mo' },
  'premium-plus': { label: 'Premium Plus', color: 'bg-yellow-100 text-yellow-800', icon: '👑', price: '$29.99/mo' }
};

const CATEGORY_OPTIONS: { id: EventCategory; label: string; icon: string }[] = [
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'food-drink', label: 'Food & Drink', icon: '🍽️' },
  { id: 'arts-culture', label: 'Arts & Culture', icon: '🎨' },
  { id: 'sports-fitness', label: 'Sports & Fitness', icon: '⚽' },
  { id: 'networking', label: 'Networking', icon: '🤝' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { id: 'learning', label: 'Learning', icon: '📚' },
  { id: 'community', label: 'Community', icon: '🏘️' },
];

const NEIGHBORHOODS = [
  'Ballard', 'Belltown', 'Capitol Hill', 'Downtown', 'Eastlake',
  'Fremont', 'Georgetown', 'Pioneer Square', 'Queen Anne',
  'Rainier Beach', 'SODO', 'South Lake Union', 'University District'
];

export default function ProfilePage() {
  const { user, logout, refreshUser } = useApp();
  const [showAuth, setShowAuth] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [form, setForm] = useState({ name: '', neighborhood: '', bio: '', interests: [] as EventCategory[] });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        <div className="text-center max-w-md">
          <User className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Your Profile</h1>
          <p className="text-gray-600 mb-6">Sign in to manage your profile, preferences, and membership.</p>
          <button onClick={() => setShowAuth(true)} className="btn-primary px-8">Sign In</button>
        </div>
      </div>
    );
  }

  const tier = TIER_INFO[user.membership_tier];

  const startEdit = () => {
    setForm({ name: user.name, neighborhood: user.neighborhood, bio: user.bio || '', interests: user.interests as EventCategory[] });
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.users.updateProfile(form);
      await refreshUser();
      setEditing(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    setUpgrading(true);
    try {
      const result = await api.payments.checkout(tier);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else if (result.mockCheckout) {
        alert(`Demo mode: Stripe is not configured.\n\nIn production, you'd be charged ${(result.plan.price / 100).toFixed(2)}/mo for ${result.plan.name}.\n\nTo enable payments, set STRIPE_SECRET_KEY in your .env file.`);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to start checkout');
    } finally {
      setUpgrading(false);
    }
  };

  const toggleInterest = (cat: EventCategory) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(cat)
        ? f.interests.filter(i => i !== cat)
        : [...f.interests, cat]
    }));
  };

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-5">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {initial}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-500">{user.email}</p>
                {user.neighborhood && (
                  <div className="flex items-center space-x-1 text-gray-500 text-sm mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{user.neighborhood}, Seattle</span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={startEdit}
              className="flex items-center space-x-1.5 text-sm text-gray-500 hover:text-primary-600 border border-gray-300 hover:border-primary-400 px-3 py-1.5 rounded-lg transition-colors">
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>

          {user.bio && <p className="text-gray-600 text-sm mb-4">{user.bio}</p>}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-primary-600">{user.events_attended}</div>
              <div className="text-xs text-gray-500 mt-1">Events Attended</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center space-x-1">
                <span className="text-xl">{tier.icon}</span>
                <span className="text-sm font-bold text-gray-900">{tier.label}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Membership</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-primary-600">
                {user.interests.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">Interests</div>
            </div>
          </div>
        </div>

        {/* Edit modal */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={2}
                    placeholder="Tell the community about yourself..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood</label>
                  <select value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                    <option value="">Select neighborhood</option>
                    {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_OPTIONS.map(cat => (
                      <button key={cat.id} type="button" onClick={() => toggleInterest(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          form.interests.includes(cat.id)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}>
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditing(false)} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={saveProfile} disabled={saving}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-60">
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Membership section */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
          <div className="flex items-center space-x-2 mb-6">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900">Membership</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.entries(TIER_INFO) as [string, typeof TIER_INFO['free']][]).map(([tierId, info]) => (
              <div key={tierId} className={`rounded-xl border-2 p-5 ${
                user.membership_tier === tierId ? 'border-primary-400 bg-primary-50' : 'border-gray-200'
              }`}>
                <div className="text-2xl mb-2">{info.icon}</div>
                <h3 className="font-bold text-gray-900">{info.label}</h3>
                <p className="text-lg font-bold text-primary-600 mt-1">{info.price}</p>
                {tierId === 'free' && (
                  <ul className="text-xs text-gray-500 mt-3 space-y-1">
                    <li>• First event free</li>
                    <li>• Browse all events</li>
                    <li>• Basic search</li>
                  </ul>
                )}
                {tierId === 'premium' && (
                  <ul className="text-xs text-gray-500 mt-3 space-y-1">
                    <li>• Early access to events</li>
                    <li>• Unlimited RSVPs</li>
                    <li>• Priority notifications</li>
                  </ul>
                )}
                {tierId === 'premium-plus' && (
                  <ul className="text-xs text-gray-500 mt-3 space-y-1">
                    <li>• Everything in Premium</li>
                    <li>• VIP event access</li>
                    <li>• Exclusive member events</li>
                  </ul>
                )}
                {user.membership_tier === tierId ? (
                  <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${info.color}`}>
                    Current Plan
                  </span>
                ) : tierId !== 'free' && user.membership_tier !== tierId && (
                  <button onClick={() => handleUpgrade(tierId)} disabled={upgrading}
                    className="mt-3 w-full btn-primary py-2 text-sm disabled:opacity-60">
                    {upgrading ? 'Loading...' : 'Upgrade'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Interests */}
        {user.interests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Star className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-bold text-gray-900">Your Interests</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.interests.map(i => {
                const cat = CATEGORY_OPTIONS.find(c => c.id === i);
                return cat ? (
                  <span key={i} className="px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                    {cat.icon} {cat.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/calendar" className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50 hover:bg-primary-50 transition-colors text-gray-700 hover:text-primary-600">
              <Calendar className="w-5 h-5" />
              <span className="font-medium text-sm">My Events</span>
            </Link>
            <Link to="/organizer" className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50 hover:bg-primary-50 transition-colors text-gray-700 hover:text-primary-600">
              <Star className="w-5 h-5" />
              <span className="font-medium text-sm">Organizer Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Sign out */}
        <div className="text-center">
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
            Sign out of {user.email}
          </button>
        </div>
      </div>
    </div>
  );
}
