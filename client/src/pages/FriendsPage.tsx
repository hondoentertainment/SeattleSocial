import { useState } from 'react';
import { Search, Users, UserPlus, Compass, Clock } from 'lucide-react';
import FriendCard from '../components/FriendCard';
import SEOHead from '../components/SEOHead';
import {
  mockUsers,
  currentUserFriendIds,
  mockFriendRequests,
  discoverSuggestions,
} from '../data/mockSocial';
import { useToast } from '../components/ToastContainer';
import { trackEvent } from '../lib/analytics';

type Tab = 'friends' | 'requests' | 'discover';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  const friends = mockUsers.filter(u => currentUserFriendIds.includes(u.id));
  const incomingRequests = mockFriendRequests.filter(
    r => r.status === 'PENDING' && !currentUserFriendIds.includes(r.from.id)
  );
  const outgoingRequests = mockFriendRequests.filter(
    r => r.status === 'PENDING' && currentUserFriendIds.includes(r.from.id) && !currentUserFriendIds.includes(r.to.id)
  );

  const filteredFriends = friends.filter(f =>
    f.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = (userId: string, action: string) => {
    if (action === 'add') {
      trackEvent('friend_request_sent', { userId });
      toast.success('Friend request sent!');
    } else if (action === 'accept') {
      toast.success('Friend request accepted!');
    } else if (action === 'decline') {
      toast.info('Friend request declined.');
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'friends', label: 'Friends', icon: <Users className="w-5 h-5" aria-hidden="true" /> },
    { id: 'requests', label: 'Requests', icon: <UserPlus className="w-5 h-5" aria-hidden="true" /> },
    { id: 'discover', label: 'Discover', icon: <Compass className="w-5 h-5" aria-hidden="true" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead title="Friends" description="Connect with friends and discover people on SeattleSocial." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Friends</h1>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit" role="tablist" aria-label="Friends navigation">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-md font-semibold text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'requests' && incomingRequests.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {incomingRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        {activeTab === 'friends' && (
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search friends by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              aria-label="Search friends by name"
            />
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div id="panel-friends" role="tabpanel" aria-label="Friends list">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  {searchQuery ? 'No friends match your search' : 'No friends yet'}
                </h2>
                <p className="text-gray-500">
                  {searchQuery ? 'Try a different search term.' : 'Discover people and send friend requests!'}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4" aria-live="polite">
                  {filteredFriends.length} friend{filteredFriends.length !== 1 ? 's' : ''}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredFriends.map(friend => (
                    <FriendCard key={friend.id} user={friend} status="friends" onAction={handleAction} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div id="panel-requests" role="tabpanel" aria-label="Friend requests">
            {/* Incoming */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">Incoming Requests</h2>
            {incomingRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm mb-8">
                <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
                <p className="text-gray-500">No pending incoming requests</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {incomingRequests.map(req => (
                  <FriendCard key={req.id} user={req.from} status="pending-incoming" onAction={handleAction} />
                ))}
              </div>
            )}

            {/* Outgoing */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sent Requests</h2>
            {outgoingRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
                <p className="text-gray-500">No pending outgoing requests</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {outgoingRequests.map(req => (
                  <FriendCard key={req.id} user={req.to} status="pending-outgoing" onAction={handleAction} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <div id="panel-discover" role="tabpanel" aria-label="Discover people">
            <h2 className="text-xl font-bold text-gray-900 mb-2">People You Might Know</h2>
            <p className="text-gray-500 mb-6">Based on shared event attendance</p>
            {discoverSuggestions.length === 0 ? (
              <div className="text-center py-16">
                <Compass className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
                <p className="text-gray-500">No suggestions right now. Attend more events to connect!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {discoverSuggestions.map(user => (
                  <FriendCard key={user.id} user={user} status="none" onAction={handleAction} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
