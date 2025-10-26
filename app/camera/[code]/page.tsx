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
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    fetchEvent();
    
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    
    // Check if already installed (standalone mode)
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone === true;
    setIsStandalone(isInStandalone);
    
    // Update manifest link
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.setAttribute('href', `/camera/${resolvedParams.code}/manifest.json`);
    } else {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = `/camera/${resolvedParams.code}/manifest.json`;
      document.head.appendChild(link);
    }
    
    // Listen for PWA install prompt (Android Chrome/Edge)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Show iOS prompt after a delay if not installed
    if (isIOSDevice && !isInStandalone) {
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
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

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
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

          {/* PWA Install Prompt */}
          {showInstallPrompt && !isStandalone && (
            <div className="mt-4 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white shadow-lg">
                <div className="flex items-start gap-3">
                  <span className="text-3xl shrink-0">📱</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Install {event.name}</h3>
                    <p className="text-sm text-white/90 mb-3">
                      Add this camera to your home screen for quick access. Works offline!
                    </p>
                    
                    {isIOS ? (
                      /* iOS Instructions */
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-2xl">1️⃣</span>
                          <span>Tap the <strong>Share</strong> button <svg className="inline w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.42 6.42 8 5l4-4 4 4zm4 14H4v-8h2v6h12v-6h2v8z"/></svg></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-2xl">2️⃣</span>
                          <span>Tap <strong>"Add to Home Screen"</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-2xl">3️⃣</span>
                          <span>Tap <strong>"Add"</strong></span>
                        </div>
                        <button
                          onClick={() => setShowInstallPrompt(false)}
                          className="mt-3 px-4 py-2 bg-white/20 text-white rounded-lg font-semibold text-sm hover:bg-white/30 transition-colors w-full"
                        >
                          Got it!
                        </button>
                      </div>
                    ) : deferredPrompt ? (
                      /* Android/Chrome Install Button */
                      <div className="flex gap-2">
                        <button
                          onClick={handleInstallClick}
                          className="px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold text-sm hover:bg-orange-50 transition-colors"
                        >
                          Install App
                        </button>
                        <button
                          onClick={() => setShowInstallPrompt(false)}
                          className="px-4 py-2 bg-white/20 text-white rounded-lg font-semibold text-sm hover:bg-white/30 transition-colors"
                        >
                          Maybe Later
                        </button>
                      </div>
                    ) : (
                      /* Fallback for other browsers */
                      <div className="text-sm">
                        <p className="mb-2">To install, look for the "Install" or "Add to Home Screen" option in your browser menu.</p>
                        <button
                          onClick={() => setShowInstallPrompt(false)}
                          className="px-4 py-2 bg-white/20 text-white rounded-lg font-semibold text-sm hover:bg-white/30 transition-colors"
                        >
                          Got it!
                        </button>
                      </div>
                    )}
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
