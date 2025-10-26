'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateAccessCode } from '@/utils/helpers';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Please sign in to create an event');
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleJoinEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('id')
        .eq('access_code', accessCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (fetchError || !data) {
        throw new Error('Event not found or inactive');
      }

      // Redirect to camera page
      router.push(`/camera/${accessCode.toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join event');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-orange-100 to-orange-50 dark:from-black dark:via-black dark:to-black transition-colors duration-200">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-linear-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Disposable Camera
            </h1>
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              Capture and share moments from your events
            </p>
            
            {/* Dashboard Button for Signed-in Users */}
            {user && !authLoading && (
              <div className="mt-6">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-orange-600 to-orange-500 dark:from-orange-500 dark:to-orange-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
                >
                  View My Events
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Manage your events and see all photos
                </p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Create Event */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-transparent dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Create Event</h2>

              {!user ? (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Sign in with Google to create and manage your events
                  </p>
                  <button
                    onClick={signInWithGoogle}
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-700 dark:text-green-400 text-sm">
                        Signed in as {user.user_metadata?.full_name || user.email}
                      </span>
                    </div>
                    <button
                      onClick={signOut}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-orange-600 to-orange-500 dark:from-orange-500 dark:to-orange-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Sign out
                    </button>
                  </div>
                  <form onSubmit={handleCreateEvent} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Event Name *
                      </label>
                      <input
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        required
                        placeholder="Birthday Party, Wedding, etc."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell guests about your event..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-linear-to-r from-orange-600 to-orange-500 dark:from-orange-500 dark:to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating...' : 'Create Event'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Join Event */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-transparent dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Join Event</h2>
              <form onSubmit={handleJoinEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Access Code *
                  </label>
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    required
                    placeholder="ABCD1234"
                    maxLength={8}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase text-center text-2xl font-mono tracking-wider bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-linear-to-r from-orange-500 to-orange-400 dark:from-orange-600 dark:to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-500 dark:hover:from-orange-500 dark:hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Joining...' : 'Join Event'}
                </button>
              </form>

              {/* Info Section */}
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">How it works:</h3>
                <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">1.</span>
                    <span>Scan the QR code or enter the access code</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">2.</span>
                    <span>Take photos or upload from your gallery</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">3.</span>
                    <span>Photos are saved to your device & shared with the event</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="text-4xl mb-3">📸</div>
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Capture Moments</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Use your phone camera to capture special moments</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-3">☁️</div>
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Auto Sync</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Photos automatically upload and save to your device</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-3">📥</div>
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Easy Download</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Event creators can download all photos at once</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
