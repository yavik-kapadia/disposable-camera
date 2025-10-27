'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { generateAccessCode, formatDate } from '@/utils/helpers';

interface Event {
  id: string;
  name: string;
  description: string | null;
  access_code: string;
  creator_name: string | null;
  created_at: string;
  is_active: boolean;
  deleted_at: string | null;
  image_count?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ id: string; name: string } | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchUserEvents();
    }
  }, [user, authLoading, router]);

  const fetchUserEvents = async () => {
    if (!user) return;

    try {
      // Fetch user's events (exclude soft-deleted ones)
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Fetch image counts for each event
      const eventsWithCounts = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { count } = await supabase
            .from('images')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          return {
            ...event,
            image_count: count || 0,
          };
        })
      );

      setEvents(eventsWithCounts);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setCreating(true);
    setError('');

    try {
      const code = generateAccessCode();
      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          name: eventName,
          description: description || null,
          creator_id: user.id,
          creator_name: user.user_metadata?.full_name || user.email || null,
          access_code: code,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Redirect to event dashboard
      router.push(`/event/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      setCreating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleDeleteClick = (eventId: string, eventName: string) => {
    console.log('🗑️ DELETE CLICKED:', { eventId, eventName });
    setEventToDelete({ id: eventId, name: eventName });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    
    console.log('✅ Delete confirmed, proceeding...');
    setShowDeleteConfirm(false);

    try {
      console.log('Attempting to delete event:', eventToDelete.id);
      
      // Soft delete: set deleted_at timestamp
      const { data, error: updateError } = await supabase
        .from('events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', eventToDelete.id)
        .select();

      console.log('Update result:', { data, error: updateError });

      if (updateError) {
        console.error('Soft delete failed:', updateError);
        throw updateError;
      }

      // Remove from local state
      setEvents(events.filter(e => e.id !== eventToDelete.id));
      
      // Also refetch to ensure server-side filter is applied
      await fetchUserEvents();
      
      setEventToDelete(null);
    } catch (err: any) {
      console.error('Error deleting event:', err);
      const errorMessage = err?.message || err?.hint || 'Unknown error';
      setError('Failed to delete event: ' + errorMessage);
    }
  };

  const handleDeleteCancel = () => {
    console.log('❌ Delete cancelled by user');
    setShowDeleteConfirm(false);
    setEventToDelete(null);
  };

  // Bulk selection handlers
  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const selectAllEvents = () => {
    if (selectedEvents.size === events.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(events.map(e => e.id)));
    }
  };

  const clearSelection = () => {
    setSelectedEvents(new Set());
  };

  // Bulk actions
  const handleBulkToggleActive = async (makeActive: boolean) => {
    if (selectedEvents.size === 0) return;

    try {
      const selectedIds = Array.from(selectedEvents);
      
      const { error: updateError } = await supabase
        .from('events')
        .update({ is_active: makeActive })
        .in('id', selectedIds);

      if (updateError) throw updateError;

      await fetchUserEvents();
      clearSelection();
    } catch (err: any) {
      console.error('Error updating events:', err);
      setError('Failed to update events: ' + err.message);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedEvents.size === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setShowBulkDeleteConfirm(false);

    try {
      const selectedIds = Array.from(selectedEvents);
      
      const { error: updateError } = await supabase
        .from('events')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', selectedIds);

      if (updateError) throw updateError;

      await fetchUserEvents();
      clearSelection();
    } catch (err: any) {
      console.error('Error deleting events:', err);
      setError('Failed to delete events: ' + err.message);
    }
  };

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteConfirm(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-50 via-orange-100 to-orange-50 dark:from-black dark:via-black dark:to-black flex items-center justify-center">
        <div className="text-xl text-gray-800 dark:text-gray-200">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-orange-100 to-orange-50 dark:from-black dark:via-black dark:to-black transition-colors duration-200">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Gradient Background */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 border border-orange-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div>
                  <h1 className="text-4xl font-bold bg-linear-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                    My Events
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p>Welcome back, <span className="font-semibold">{user.user_metadata?.full_name || user.email}</span></p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="px-5 py-2.5 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-300 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 transition-all font-medium"
              >
                Home
              </button>
              <button
                onClick={handleSignOut}
                className="px-5 py-2.5 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-red-300 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-gray-700 transition-all font-medium"
              >
              Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-orange-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-md">
                🎉
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Events</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{events.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-orange-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-md">
                ✅
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Events</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{events.filter(e => e.is_active).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-orange-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-md">
                📷
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Photos</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{events.reduce((sum, e) => sum + (e.image_count || 0), 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Event Button - Only show when events exist */}
        {!showCreateForm && events.length > 0 && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-8 px-8 py-4 bg-linear-to-r from-orange-600 to-orange-500 dark:from-orange-500 dark:to-orange-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 transition-all flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 transform"
          >
            <span className="text-2xl">✨</span>
            <span>Create New Event</span>
          </button>
        )}

        {/* Create Event Form */}
        {showCreateForm && (
          <div className="mb-8 bg-linear-to-br from-white to-orange-50 dark:from-gray-900 dark:to-black rounded-2xl shadow-xl p-8 border-2 border-orange-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-xl shadow-md">
                  ✨
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Create New Event</h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEventName('');
                  setDescription('');
                  setError('');
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  placeholder="e.g., Sarah's Birthday Party"
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell guests about your event and what to expect..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-linear-to-r from-orange-600 to-orange-500 dark:from-orange-500 dark:to-orange-600 text-white py-4 rounded-xl font-bold hover:from-orange-700 hover:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] transform"
                >
                  {creating ? '✨ Creating...' : '🚀 Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEventName('');
                    setDescription('');
                    setError('');
                  }}
                  className="px-8 py-4 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        {events.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-orange-100 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-4">
              {/* Select All */}
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedEvents.size === events.length && events.length > 0}
                  onChange={selectAllEvents}
                  className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                  Select All ({events.length})
                </span>
              </label>

              {/* Selected Count */}
              {selectedEvents.size > 0 && (
                <>
                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {selectedEvents.size} selected
                  </span>
                  
                  {/* Bulk Action Buttons */}
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => handleBulkToggleActive(true)}
                      className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-semibold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm flex items-center gap-2"
                    >
                      ✅ Open
                    </button>
                    <button
                      onClick={() => handleBulkToggleActive(false)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm flex items-center gap-2"
                    >
                      🔒 Close
                    </button>
                    <button
                      onClick={handleBulkDeleteClick}
                      className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm flex items-center gap-2"
                    >
                      🗑️ Delete
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm border border-gray-300 dark:border-gray-600"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Events List */}
        {events.length === 0 ? (
          <div className="bg-linear-to-br from-white to-orange-50 dark:from-gray-900 dark:to-black rounded-2xl shadow-xl p-16 text-center border-2 border-dashed border-orange-300 dark:border-gray-700">
            <div className="w-24 h-24 bg-linear-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">
              📸
            </div>
            <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">No events yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg max-w-md mx-auto">
              Create your first event to start collecting and sharing memorable moments with friends and family
            </p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-8 py-4 bg-linear-to-r from-orange-600 to-orange-500 dark:from-orange-500 dark:to-orange-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 transition-all inline-flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                <span className="text-2xl">✨</span>
                <span>Create Your First Event</span>
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Your Events</h2>
              <p className="text-gray-600 dark:text-gray-400">{events.length} event{events.length !== 1 ? 's' : ''}</p>
            </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 cursor-pointer border-2 hover:scale-[1.02] transform ${
                  selectedEvents.has(event.id)
                    ? 'border-orange-500 dark:border-orange-400 bg-orange-50/50 dark:bg-orange-900/10'
                    : 'border-transparent hover:border-orange-200 dark:hover:border-orange-500'
                }`}
                onClick={() => router.push(`/event/${event.id}`)}
              >
                {/* Checkbox for selection */}
                <div className="flex items-start gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={selectedEvents.has(event.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleEventSelection(event.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  
                  {/* Header with Icon and Status */}
                  <div className="flex justify-between items-start flex-1">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 bg-linear-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center text-white text-xl shadow-md shrink-0">
                        🎉
                      </div>
                      <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {event.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          event.is_active
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${event.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                        {event.is_active ? 'Active' : 'Closed'}
                      </span>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Description */}
                {event.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                )}

                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-gray-700 my-4"></div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📷</span>
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Photos</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{event.image_count || 0}</p>
                  </div>
                  
                  <div className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🔑</span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Code</span>
                    </div>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300 font-mono">{event.access_code}</p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>📅</span>
                  <span>Created {formatDate(event.created_at)}</span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/event/${event.id}`);
                    }}
                    className="w-full py-3 bg-linear-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 dark:hover:from-orange-500 dark:hover:to-orange-600 transition-all shadow-md hover:shadow-lg group-hover:scale-[1.05] transform"
                  >
                    View Event →
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(event.id, event.name);
                    }}
                    className="w-full py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                  >
                    🗑️ Delete Event
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && eventToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-red-500 dark:border-red-600">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Delete Event?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete <strong className="text-gray-900 dark:text-gray-100">"{eventToDelete.name}"</strong>?
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    ⚠️ This will mark the event as deleted.<br />
                    Data will be kept for 14 days for recovery.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-6 py-3 bg-red-600 dark:bg-red-700 text-white rounded-xl font-bold hover:bg-red-700 dark:hover:bg-red-600 transition-colors shadow-lg"
                >
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-red-500 dark:border-red-600">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Delete {selectedEvents.size} Event{selectedEvents.size !== 1 ? 's' : ''}?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete <strong className="text-gray-900 dark:text-gray-100">{selectedEvents.size} selected event{selectedEvents.size !== 1 ? 's' : ''}</strong>?
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    ⚠️ This will mark all selected events as deleted.<br />
                    Data will be kept for 14 days for recovery.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleBulkDeleteCancel}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDeleteConfirm}
                  className="flex-1 px-6 py-3 bg-red-600 dark:bg-red-700 text-white rounded-xl font-bold hover:bg-red-700 dark:hover:bg-red-600 transition-colors shadow-lg"
                >
                  Delete {selectedEvents.size} Event{selectedEvents.size !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
