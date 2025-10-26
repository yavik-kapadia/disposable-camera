'use client';

import { useRef, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { compressImage, generateThumbnail } from '@/utils/helpers';

interface CameraCaptureProps {
  eventId: string;
  onUploadSuccess?: () => void;
  onCameraStart?: () => void;
}

export default function CameraCapture({ eventId, onUploadSuccess, onCameraStart }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState(0); // Track number of uploads in progress
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState('');
  const [photoCount, setPhotoCount] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'none' | 'bw' | 'sepia' | 'vintage'>('none');
  const [switching, setSwitching] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supportsFullscreen, setSupportsFullscreen] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [rotation, setRotation] = useState(0); // CSS rotation in degrees
  const containerRef = useRef<HTMLDivElement>(null);

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
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraActive(true);
        
        // Notify parent that camera has started
        if (onCameraStart) {
          onCameraStart();
        }
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
    const wasActive = cameraActive; // Remember if camera was active
    setSwitching(true);
    stopCamera();
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    // If camera was active, restart it with the new facing mode
    if (wasActive) {
      // Small delay to ensure old stream is fully stopped
      setTimeout(async () => {
        await startCamera();
        setSwitching(false);
      }, 100);
    } else {
      setSwitching(false);
    }
  };

  useEffect(() => {
    // Check if fullscreen is supported
    const elem = document.documentElement as any;
    const isSupported = !!(
      elem.requestFullscreen ||
      elem.webkitRequestFullscreen ||
      elem.mozRequestFullScreen ||
      elem.msRequestFullscreen
    );
    setSupportsFullscreen(isSupported);

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, []);

  // Fullscreen change listener (with vendor prefixes)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFullscreen);
    };

    // Listen to all vendor-prefixed fullscreen events
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Pinch to zoom for mobile
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    let initialDistance = 0;
    let initialZoom = 1;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        initialZoom = zoom;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const scale = currentDistance / initialDistance;
        const newZoom = Math.min(Math.max(initialZoom * scale, 1), 3);
        setZoom(newZoom);
      }
    };

    videoElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    videoElement.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      videoElement.removeEventListener('touchstart', handleTouchStart);
      videoElement.removeEventListener('touchmove', handleTouchMove);
    };
  }, [zoom]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      const elem = containerRef.current as any;
      
      // Check if already in fullscreen
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isFullscreen) {
        // Enter fullscreen with vendor prefixes
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        } else {
          throw new Error('Fullscreen API not supported');
        }
      } else {
        // Exit fullscreen with vendor prefixes
        const doc = document as any;
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      // Silently fail - button won't be shown if not supported anyway
    }
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.max(prev - 0.5, 1));
  };

  const resetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
  };

  // Timer countdown effect
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      setCountdown(null);
      executeCapturePhoto();
      return;
    }
    
    const timeout = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [countdown]);

  // Handle orientation changes
  useEffect(() => {
    // Detect and update orientation state
    const updateOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const newOrientation = isLandscape ? 'landscape' : 'portrait';
      setOrientation(newOrientation);
      
      // Don't rotate - let iOS handle camera orientation naturally
      setRotation(0);
      
      console.log('[Camera] Orientation:', newOrientation, 'FacingMode:', facingMode);
    };

    // Initial orientation
    updateOrientation();

    let debounceTimer: NodeJS.Timeout;

    const handleOrientationChange = () => {
      // Update orientation immediately (instant UI update, no camera restart)
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        updateOrientation();
      }, 100); // Short debounce just to avoid duplicate resize events
    };

    // Listen to both orientationchange and resize (resize is more reliable)
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [cameraActive, facingMode, stream, orientation, rotation]);

  const executeCapturePhoto = async () => {
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

    // Apply filter
    if (filter !== 'none') {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (filter === 'bw') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          data[i] = data[i + 1] = data[i + 2] = gray;
        } else if (filter === 'sepia') {
          data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        } else if (filter === 'vintage') {
          data[i] = Math.min(255, r * 1.1);
          data[i + 1] = Math.min(255, g * 0.9);
          data[i + 2] = Math.min(255, b * 0.7);
        }
      }
      
      context.putImageData(imageData, 0, 0);
    }

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

      // Show preview
      const previewUrl = URL.createObjectURL(blob);
      setPreviewImage(previewUrl);
      
      // Increment photo count
      setPhotoCount(prev => prev + 1);
      
      // Allow user to take another photo immediately
      setCapturing(false);
      setUploading(false);
      
      // Auto-hide preview after 2 seconds
      setTimeout(() => {
        setPreviewImage(null);
        URL.revokeObjectURL(previewUrl);
      }, 2000);

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

  const capturePhoto = () => {
    if (timer) {
      setCountdown(timer);
    } else {
      executeCapturePhoto();
    }
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

      {/* Camera Toolbar - iOS Native Style */}
      {cameraActive && (
        <div className="mb-4 flex flex-wrap gap-3 justify-center px-4">
          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-5 py-3 rounded-xl font-semibold transition-all shadow-sm active:scale-95 min-h-[44px] ${
              showGrid
                ? 'bg-orange-500 text-white shadow-orange-200 dark:shadow-orange-900'
                : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 ios-glass'
            }`}
            title="Toggle composition grid"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h16M4 12h16M4 19h16" />
              </svg>
              <span className="text-sm">Grid</span>
            </span>
          </button>

          {/* Timer Selection */}
          <select
            value={timer || ''}
            onChange={(e) => setTimer(e.target.value ? Number(e.target.value) : null)}
            className="px-5 py-3 rounded-xl font-semibold bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm ios-glass min-h-[44px] text-sm"
            title="Set self-timer"
          >
            <option value="">⏱️ No Timer</option>
            <option value="3">⏱️ 3s</option>
            <option value="5">⏱️ 5s</option>
            <option value="10">⏱️ 10s</option>
          </select>

          {/* Filter Selection */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-5 py-3 rounded-xl font-semibold bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm ios-glass min-h-[44px] text-sm"
            title="Apply filter"
          >
            <option value="none">🎨 No Filter</option>
            <option value="bw">⬛ Black & White</option>
            <option value="sepia">📜 Sepia</option>
            <option value="vintage">📸 Vintage</option>
          </select>
        </div>
      )}

      <div
        ref={containerRef}
        className={`relative bg-black overflow-hidden shadow-2xl transition-all duration-300 ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'rounded-2xl w-full max-w-4xl mx-auto'
        }`}
        style={{
          aspectRatio: isFullscreen ? 'auto' : (orientation === 'landscape' ? '16/9' : '3/4')
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
          style={{
            filter: filter === 'bw' ? 'grayscale(100%)' : 
                   filter === 'sepia' ? 'sepia(100%)' : 
                   filter === 'vintage' ? 'saturate(80%) sepia(20%) hue-rotate(-10deg)' : 
                   'none',
            transform: `scale(${zoom})`,
            transition: 'transform 0.2s ease-out'
          }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Photo Counter */}
        {cameraActive && photoCount > 0 && (
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-semibold">
            📸 {photoCount}
          </div>
        )}

        {/* Zoom Level Indicator */}
        {cameraActive && zoom > 1 && (
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-semibold">
            {zoom.toFixed(1)}×
          </div>
        )}

        {/* Zoom Controls - Side Panel */}
        {cameraActive && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 bg-black/70 hover:bg-black/90 rounded-full backdrop-blur-sm disabled:opacity-30 transition-all"
              title="Zoom in"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-2 bg-black/70 hover:bg-black/90 rounded-full backdrop-blur-sm disabled:opacity-30 transition-all"
              title="Zoom out"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            {zoom > 1 && (
              <button
                onClick={resetZoom}
                className="p-2 bg-black/70 hover:bg-black/90 rounded-full backdrop-blur-sm transition-all"
                title="Reset zoom"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Fullscreen Toggle */}
        {cameraActive && supportsFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 left-1/2 -translate-x-1/2 p-2 bg-black/70 hover:bg-black/90 rounded-full backdrop-blur-sm transition-all"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
        )}

        {/* Grid Overlay */}
        {showGrid && cameraActive && (
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="33.33" y1="0" x2="33.33" y2="100" stroke="white" strokeWidth="0.3" opacity="0.5" />
              <line x1="66.66" y1="0" x2="66.66" y2="100" stroke="white" strokeWidth="0.3" opacity="0.5" />
              <line x1="0" y1="33.33" x2="100" y2="33.33" stroke="white" strokeWidth="0.3" opacity="0.5" />
              <line x1="0" y1="66.66" x2="100" y2="66.66" stroke="white" strokeWidth="0.3" opacity="0.5" />
            </svg>
          </div>
        )}

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
            <div className="text-white text-9xl font-bold animate-pulse">
              {countdown}
            </div>
          </div>
        )}

        {/* Preview Image Overlay */}
        {previewImage && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
              ✓ Photo captured!
            </div>
          </div>
        )}

        {/* Switching Camera Overlay */}
        {switching && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 gap-4">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <div className="text-white text-lg font-semibold">Switching camera...</div>
          </div>
        )}

        {/* Camera Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-between">
            {/* Switch Camera */}
            <button
              onClick={switchCamera}
              disabled={!cameraActive || switching}
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

        {!cameraActive && !switching && (
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

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
        {!error ? (
          <>
            Photos are automatically saved to your device and uploaded to the event
            {cameraActive && (
              <span className="block mt-1 text-xs text-gray-500 dark:text-gray-500">
                💡 Pinch to zoom on mobile • Use zoom buttons
                {supportsFullscreen && ' • Click fullscreen for immersive mode'}
              </span>
            )}
          </>
        ) : (
          'Having camera issues? Switch to the Upload tab to select photos from your gallery'
        )}
      </p>
    </div>
  );
}
