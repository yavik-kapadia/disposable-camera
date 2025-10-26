'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateAccessCode } from '@/utils/helpers';

export default function Home() {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const code = generateAccessCode();
      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          name: eventName,
          description: description || null,
          creator_name: creatorName || null,
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Disposable Camera
            </h1>
            <p className="text-gray-600 text-lg">
              Capture and share moments from your events
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Create Event */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                    placeholder="Birthday Party, Wedding, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell guests about your event..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              </form>
            </div>

            {/* Join Event */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Join Event</h2>
              <form onSubmit={handleJoinEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Code *
                  </label>
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    required
                    placeholder="ABCD1234"
                    maxLength={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase text-center text-2xl font-mono tracking-wider"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Joining...' : 'Join Event'}
                </button>
              </form>

              {/* Info Section */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3">How it works:</h3>
                <ol className="space-y-2 text-sm text-gray-600">
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
              <h3 className="font-semibold mb-2">Capture Moments</h3>
              <p className="text-sm text-gray-600">Use your phone camera to capture special moments</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-3">☁️</div>
              <h3 className="font-semibold mb-2">Auto Sync</h3>
              <p className="text-sm text-gray-600">Photos automatically upload and save to your device</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-3">📥</div>
              <h3 className="font-semibold mb-2">Easy Download</h3>
              <p className="text-sm text-gray-600">Event creators can download all photos at once</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
