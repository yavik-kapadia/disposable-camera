'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CameraCapture from '@/components/CameraCapture';
import ManualUpload from '@/components/ManualUpload';

interface Event {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export default function CameraPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [uploadCount, setUploadCount] = useState(0);
  const [cameraStarted, setCameraStarted] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [resolvedParams.code]);

  const fetchEvent = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('id, name, description, is_active')
        .eq('access_code', resolvedParams.code.toUpperCase())
        .single();

      if (fetchError || !data) {
        throw new Error('Event not found');
      }

      const eventData = data as Event;

      if (!eventData.is_active) {
        throw new Error('This event has been closed');
      }

      setEvent(eventData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setUploadCount((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 flex items-center justify-center">
        <div className="text-xl">Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">😞</div>
          <p className="text-xl text-red-600 mb-4">{error || 'Event not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            {event.name}
          </h1>
          {event.description && (
            <p className="text-gray-600 mb-4">{event.description}</p>
          )}
          {uploadCount > 0 && (
            <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              {uploadCount} photo{uploadCount > 1 ? 's' : ''} uploaded! 🎉
            </div>
          )}
          
          {/* Privacy Notice - Hide when camera is started */}
          {!cameraStarted && (
            <div className="mt-4 max-w-2xl mx-auto">
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 text-xl shrink-0">ℹ️</span>
                  <div className="text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Your photos will be uploaded to the event organizer's gallery. 
                    Only the event creator can view all submitted photos.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-lg shadow-md p-1">
            <button
              onClick={() => setMode('camera')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                mode === 'camera'
                  ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📸 Camera
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                mode === 'upload'
                  ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📤 Upload
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {mode === 'camera' ? (
            <CameraCapture 
              eventId={event.id} 
              onUploadSuccess={handleUploadSuccess}
              onCameraStart={() => setCameraStarted(true)}
            />
          ) : (
            <ManualUpload eventId={event.id} onUploadSuccess={handleUploadSuccess} />
          )}
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="text-orange-600 hover:text-orange-700 font-semibold"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
