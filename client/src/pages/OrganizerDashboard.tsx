import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, BarChart2, Users, DollarSign, Calendar, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import type { OrganizerEvent, OrganizerStats, CreateEventPayload } from '../utils/api';
import AuthModal from '../components/AuthModal';
import type { EventCategory } from '../types';

const CATEGORIES: { id: EventCategory; label: string }[] = [
  { id: 'music', label: 'Music' },
  { id: 'food-drink', label: 'Food & Drink' },
  { id: 'arts-culture', label: 'Arts & Culture' },
  { id: 'sports-fitness', label: 'Sports & Fitness' },
  { id: 'networking', label: 'Networking' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'learning', label: 'Learning' },
  { id: 'community', label: 'Community' },
];

const NEIGHBORHOODS = [
  'Ballard', 'Belltown', 'Capitol Hill', 'Downtown', 'Eastlake',
  'Fremont', 'Georgetown', 'Pioneer Square', 'Queen Anne',
  'Rainier Beach', 'SODO', 'South Lake Union', 'University District'
];

const EMPTY_FORM: CreateEventPayload = {
  title: '', description: '', venueName: '', venueAddress: '', venueNeighborhood: 'Capitol Hill',
  startTime: '', endTime: '', category: 'music', price: 0, capacity: 100, imageUrl: '', tags: []
};

export default function OrganizerDashboard() {
  const { user } = useApp();
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [stats, setStats] = useState<OrganizerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateEventPayload>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([api.organizer.events(), api.organizer.stats()])
      .then(([{ events: e }, { stats: s }]) => { setEvents(e); setStats(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setTagsInput('');
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (event: OrganizerEvent) => {
    setForm({
      title: event.title, description: '', venueName: '', venueAddress: '', venueNeighborhood: 'Capitol Hill',
      startTime: event.startTime, endTime: '', category: event.category as EventCategory,
      price: event.price, capacity: event.capacity, imageUrl: event.imageUrl, tags: []
    });
    setTagsInput('');
    setEditingId(event.id);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...form, tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean) };
      if (editingId) {
        const { event } = await api.organizer.update(editingId, payload);
        setEvents(prev => prev.map(ev => ev.id === editingId ? event as unknown as OrganizerEvent : ev));
      } else {
        const { event } = await api.organizer.create(payload);
        setEvents(prev => [event, ...prev]);
        if (stats) setStats(s => s ? { ...s, totalEvents: s.totalEvents + 1 } : s);
      }
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    try {
      await api.organizer.delete(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleTogglePublish = async (event: OrganizerEvent) => {
    try {
      await api.organizer.update(event.id, { isPublished: !event.isPublished });
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, isPublished: !e.isPublished } : e));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        <div className="text-center max-w-md">
          <BarChart2 className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Organizer Dashboard</h1>
          <p className="text-gray-600 mb-6">Sign in to create and manage your events.</p>
          <button onClick={() => setShowAuth(true)} className="btn-primary px-8">Sign In</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your events and track performance</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create Event</span>
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<Calendar className="w-6 h-6 text-primary-600" />} label="Total Events" value={stats.totalEvents} />
            <StatCard icon={<Calendar className="w-6 h-6 text-blue-500" />} label="Upcoming" value={stats.upcomingEvents} />
            <StatCard icon={<Users className="w-6 h-6 text-green-500" />} label="Total Attendees" value={stats.totalAttendees} />
            <StatCard icon={<DollarSign className="w-6 h-6 text-yellow-500" />} label="Revenue" value={`$${stats.totalRevenue.toFixed(0)}`} />
          </div>
        )}

        {/* Event Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {editingId ? 'Edit Event' : 'Create New Event'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                      <input required type="text" value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Jazz Night at Tula's"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                      <textarea required value={form.description} rows={3}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Describe your event..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select required value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value as EventCategory }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood *</label>
                      <select required value={form.venueNeighborhood}
                        onChange={e => setForm(f => ({ ...f, venueNeighborhood: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                        {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
                      <input required type="text" value={form.venueName}
                        onChange={e => setForm(f => ({ ...f, venueName: e.target.value }))}
                        placeholder="e.g. Tula's Jazz Club"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Venue Address</label>
                      <input type="text" value={form.venueAddress}
                        onChange={e => setForm(f => ({ ...f, venueAddress: e.target.value }))}
                        placeholder="e.g. 2214 2nd Ave"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
                      <input required type="datetime-local" value={form.startTime}
                        onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label>
                      <input required type="datetime-local" value={form.endTime}
                        onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price ($)</label>
                      <input type="number" min="0" step="1" value={form.price}
                        onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                      <input type="number" min="1" value={form.capacity}
                        onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                      <input type="url" value={form.imageUrl}
                        onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                      <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                        placeholder="e.g. live-music, 21+, outdoor"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">Cancel</button>
                    <button type="submit" disabled={submitting} className="flex-1 btn-primary disabled:opacity-60">
                      {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Event'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Events Table */}
        {events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="text-5xl mb-4">🎪</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-6">Create your first event and start building your audience.</p>
            <button onClick={openCreate} className="btn-primary">Create Your First Event</button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Event</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Tickets</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Revenue</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.map(event => (
                    <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {event.imageUrl && (
                            <img src={event.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          )}
                          <div>
                            <Link to={`/events/${event.id}`} className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-1">
                              {event.title}
                            </Link>
                            <span className="text-xs text-gray-400 capitalize">{event.category.replace('-', ' & ')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(event.startTime)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{event.ticketsSold}/{event.capacity}</div>
                        <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (event.ticketsSold / event.capacity) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        ${(event.ticketsSold * event.price).toFixed(0)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          event.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {event.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleTogglePublish(event)}
                            title={event.isPublished ? 'Unpublish' : 'Publish'}
                            className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors">
                            {event.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openEdit(event)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(event.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <div className="flex items-center space-x-3 mb-2">
        {icon}
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
