'use client';

import { useRef, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { compressImage, generateThumbnail } from '@/utils/helpers';

interface CameraCaptureProps {
  eventId: string;
  onUploadSuccess?: () => void;
}

export default function CameraCapture({ eventId, onUploadSuccess }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState(0); // Track number of uploads in progress
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState('');

  const startCamera = async () => {
    try {
      setError('');

      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available. Please use HTTPS or a modern browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraActive(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage + ' Please ensure you\'re using HTTPS and have granted camera permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    // Only auto-start camera when switching cameras, not on initial mount
    if (cameraActive && facingMode) {
      startCamera();
    }
  }, [facingMode]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, []);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setCapturing(false);
        return;
      }

      // Flash effect immediately
      const flashDiv = document.createElement('div');
      flashDiv.className =
        'fixed inset-0 bg-white z-50 pointer-events-none';
      flashDiv.style.animation = 'flash 0.2s ease-out';
      document.body.appendChild(flashDiv);
      setTimeout(() => document.body.removeChild(flashDiv), 200);

      // Allow user to take another photo immediately
      setCapturing(false);
      setUploading(false);

      // Upload in background (non-blocking)
      setUploadQueue(prev => prev + 1);
      
      (async () => {
        try {
          const originalFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

          // Compress full-size image
          const compressedBlob = await compressImage(originalFile);

          // Generate WebP thumbnail client-side
          const thumbnailBlob = await generateThumbnail(originalFile);

          // Generate unique filenames
          const timestamp = Date.now();
          const fileName = `photo_${timestamp}.jpg`;
          const thumbnailName = `thumb_${timestamp}.webp`;
          const filePath = `${eventId}/${fileName}`;
          const thumbnailPath = `${eventId}/${thumbnailName}`;

          // Upload full-size image to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(filePath, compressedBlob, {
              contentType: 'image/jpeg',
              upsert: false,
            });

          if (uploadError) throw uploadError;

          // Upload thumbnail
          const { error: thumbError } = await supabase.storage
            .from('event-images')
            .upload(thumbnailPath, thumbnailBlob, {
              contentType: 'image/webp',
              upsert: false,
            });

          if (thumbError) throw thumbError;

          // Save metadata to database with thumbnail path
          const { error: dbError } = await supabase.from('images').insert({
            event_id: eventId,
            file_path: filePath,
            file_name: fileName,
            thumbnail_path: thumbnailPath,
            uploaded_by: null,
            metadata: {
              timestamp,
              type: 'camera',
            },
          });

          if (dbError) throw dbError;

          if (onUploadSuccess) {
            onUploadSuccess();
          }
        } catch (err) {
          console.error('Background upload error:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error('Error details:', errorMessage);
          // Show a non-intrusive error notification instead of alert
          const errorDiv = document.createElement('div');
          errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
          errorDiv.textContent = `Upload failed: ${errorMessage}`;
          document.body.appendChild(errorDiv);
          setTimeout(() => document.body.removeChild(errorDiv), 5000);
        } finally {
          setUploadQueue(prev => Math.max(0, prev - 1));
        }
      })();
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Upload Queue Indicator */}
      {uploadQueue > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Uploading {uploadQueue} photo{uploadQueue > 1 ? 's' : ''}...</span>
        </div>
      )}

      <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-between">
            {/* Switch Camera */}
            <button
              onClick={switchCamera}
              disabled={!cameraActive}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm disabled:opacity-50 transition-all"
              title="Switch camera"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            {/* Capture Button */}
            <button
              onClick={capturePhoto}
              disabled={!cameraActive || capturing}
              className="w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center backdrop-blur-sm"
            >
              <div className="w-16 h-16 rounded-full bg-white" />
            </button>

            {/* Restart Camera */}
            <button
              onClick={cameraActive ? stopCamera : startCamera}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all"
              title={cameraActive ? 'Stop camera' : 'Start camera'}
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {cameraActive ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6">
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors mb-4"
            >
              Start Camera
            </button>
            {error && (
              <div className="text-sm text-gray-300 text-center max-w-md">
                <p className="mb-2">Trouble starting the camera?</p>
                <ul className="text-xs text-left space-y-1">
                  <li>• Make sure you're using HTTPS (not HTTP)</li>
                  <li>• Grant camera permissions when prompted</li>
                  <li>• Try the Upload tab instead</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 mt-4 text-center">
        {!error ? (
          'Photos are automatically saved to your device and uploaded to the event'
        ) : (
          'Having camera issues? Switch to the Upload tab to select photos from your gallery'
        )}
      </p>
    </div>
  );
}
