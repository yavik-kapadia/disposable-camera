'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import { downloadFile, formatDate } from '@/utils/helpers';

// Lazy load QRCodeGenerator - only needed for event creators
const QRCodeGenerator = dynamic(() => import('@/components/QRCodeGenerator'), {
  loading: () => <div className="w-[200px] h-[200px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />,
});

interface Event {
  id: string;
  name: string;
  description: string | null;
  access_code: string;
  creator_name: string | null;
  created_at: string;
  is_active: boolean;
}

interface Image {
  id: string;
  created_at: string;
  file_path: string;
  file_name: string;
  thumbnail_path?: string | null;
  uploaded_by: string | null;
}

export default function EventDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 15;
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const cameraUrl = event ? `${appUrl}/camera/${event.access_code}` : '';

  useEffect(() => {
    if (!authLoading) {
      fetchEventData();
    }

    // Set up real-time subscription for new images and deletions
    const channel = supabase
      .channel('images-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'images',
          filter: `event_id=eq.${resolvedParams.id}`,
        },
        (payload) => {
          setImages((prev) => [payload.new as Image, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'images',
          filter: `event_id=eq.${resolvedParams.id}`,
        },
        (payload) => {
          setImages((prev) => prev.filter((img) => img.id !== (payload.old as Image).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedParams.id, authLoading, user]);

  const fetchEventData = async () => {
    try {
      // Check if user is authenticated
      if (!authLoading && !user) {
        setError('You must be signed in to view event details');
        setLoading(false);
        return;
      }

      if (authLoading) {
        return; // Wait for auth to load
      }
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (eventError) throw eventError;
      
      // Verify user is the event creator
      if (eventData.creator_id !== user?.id) {
        setError('You do not have permission to view this event. Only the event creator can access event photos.');
        setLoading(false);
        return;
      }
      
      setEvent(eventData);

      // Fetch images
      const { data: imagesData, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .eq('event_id', resolvedParams.id)
        .order('created_at', { ascending: false });

      if (imagesError) throw imagesError;
      setImages(imagesData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const toggleEventStatus = async () => {
    if (!event) return;

    try {
      const newStatus = !event.is_active;
      const { error } = await supabase
        .from('events')
        .update({ is_active: newStatus })
        .eq('id', event.id);

      if (error) throw error;

      setEvent({ ...event, is_active: newStatus });
    } catch (err) {
      alert('Failed to update event status');
    }
  };

  const downloadAllImages = async () => {
    if (images.length === 0) {
      alert('No images to download');
      return;
    }

    setDownloading(true);
    try {
      // Lazy load JSZip only when needed (~100KB)
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const folder = zip.folder(event?.name || 'event-photos');

      // Fetch all images
      for (const image of images) {
        try {
          const { data, error } = await supabase.storage
            .from('event-images')
            .download(image.file_path);

          if (error) throw error;
          if (data) {
            folder?.file(image.file_name, data);
          }
        } catch (err) {
          console.error(`Failed to download ${image.file_name}:`, err);
        }
      }

      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' });
      downloadFile(content, `${event?.name || 'event'}-photos.zip`);
    } catch (err) {
      alert('Failed to download images');
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Pagination logic
  const totalPages = Math.ceil(images.length / imagesPerPage);
  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = images.slice(indexOfFirstImage, indexOfLastImage);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of gallery
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Bulk selection handlers
  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const selectAllImages = () => {
    if (selectedImages.size === currentImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(currentImages.map(img => img.id)));
    }
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  // Bulk delete handler
  const handleBulkDeleteClick = () => {
    if (selectedImages.size === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setShowBulkDeleteConfirm(false);
    
    try {
      const imagesToDelete = images.filter(img => selectedImages.has(img.id));
      
      for (const image of imagesToDelete) {
        // Delete from storage (both full image and thumbnail)
        const filesToDelete = [image.file_path];
        if (image.thumbnail_path) {
          filesToDelete.push(image.thumbnail_path);
        }

        const { error: storageError } = await supabase.storage
          .from('event-images')
          .remove(filesToDelete);

        if (storageError) {
          console.error('Storage deletion error for', image.file_name, ':', storageError);
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from('images')
          .delete()
          .eq('id', image.id);

        if (dbError) {
          console.error('Database deletion error for', image.file_name, ':', dbError);
        }
      }

      // Refresh image list
      await fetchEventData();
      clearSelection();
    } catch (err) {
      console.error('Error in bulk delete:', err);
      setError('Failed to delete some images');
    }
  };

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteConfirm(false);
  };

  const deleteImage = async (image: Image) => {
    if (!confirm(`Delete ${image.file_name}? This cannot be undone.`)) {
      return;
    }

    try {
      // Delete from storage (both full image and thumbnail)
      const filesToDelete = [image.file_path];
      if (image.thumbnail_path) {
        filesToDelete.push(image.thumbnail_path);
      }

      const { error: storageError } = await supabase.storage
        .from('event-images')
        .remove(filesToDelete);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', image.id);

      if (dbError) throw dbError;

      // Update local state (real-time subscription will also update, but this is instant)
      setImages((prev) => prev.filter((img) => img.id !== image.id));

      console.log('[Delete] Successfully deleted:', image.file_name);
    } catch (err) {
      console.error('[Delete] Failed to delete image:', err);
      alert('Failed to delete image. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-50 via-orange-100 to-orange-50 dark:from-black dark:via-black dark:to-black flex items-center justify-center">
        <div className="text-xl text-gray-800 dark:text-gray-200">Loading...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-50 via-orange-100 to-orange-50 dark:from-black dark:via-black dark:to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 dark:text-red-400 mb-4">{error || 'Event not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-orange-100 to-orange-50 dark:from-black dark:via-black dark:to-black transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 mb-4 flex items-center gap-2"
          >
            ← Back to Home
          </button>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">{event.name}</h1>
          {event.description && <p className="text-gray-600 dark:text-gray-400">{event.description}</p>}
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Created {formatDate(event.created_at)}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* QR Code and Access Info */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sticky top-8 border border-transparent dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Event Access</h2>

              {/* QR Code */}
              <div className="mb-6">
                <QRCodeGenerator value={cameraUrl} size={200} />
              </div>

              {/* Access Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Access Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={event.access_code}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-center font-mono text-xl text-gray-800 dark:text-gray-200 font-bold"
                  />
                  <button
                    onClick={() => copyToClipboard(event.access_code)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"
                    title="Copy code"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* Share URL */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Share Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cameraUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(cameraUrl)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"
                    title="Copy link"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={downloadAllImages}
                  disabled={downloading || images.length === 0}
                  className="w-full px-4 py-3 bg-linear-to-r from-orange-600 to-orange-500 dark:from-orange-500 dark:to-orange-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? 'Downloading...' : `Download All (${images.length})`}
                </button>
                <button
                  onClick={toggleEventStatus}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                    event.is_active
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {event.is_active ? 'Close Event' : 'Reopen Event'}
                </button>
              </div>

              {/* Status */}
              <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Status:{' '}
                  <span
                    className={`font-semibold ${
                      event.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {event.is_active ? 'Active' : 'Closed'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-transparent dark:border-gray-700">
              <h2 className="text-xl text-gray-800 dark:text-gray-100 font-bold mb-4">
                Photos ({images.length})
              </h2>

              {images.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="text-6xl mb-4">📷</div>
                  <p>No photos yet!</p>
                  <p className="text-sm mt-2">Share the access code with guests to start collecting photos</p>
                </div>
              ) : (
                <>
                  {/* Bulk Actions Toolbar */}
                  <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Select All */}
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedImages.size === currentImages.length && currentImages.length > 0}
                          onChange={selectAllImages}
                          className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                          Select All on Page ({currentImages.length})
                        </span>
                      </label>

                      {/* Selected Count & Actions */}
                      {selectedImages.size > 0 && (
                        <>
                          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                            {selectedImages.size} selected
                          </span>
                          
                          {/* Bulk Action Buttons */}
                          <div className="flex gap-2 ml-auto">
                            <button
                              onClick={handleBulkDeleteClick}
                              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm flex items-center gap-2"
                            >
                              🗑️ Delete ({selectedImages.size})
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

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {currentImages.map((image) => (
                      <ImageCard 
                        key={image.id} 
                        image={image} 
                        onDelete={deleteImage}
                        isSelected={selectedImages.has(image.id)}
                        onToggleSelection={toggleImageSelection}
                      />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                      >
                        ← Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                              currentPage === page
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                            title={`Page ${page}`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                  
                  {/* Page Info */}
                  {totalPages > 1 && (
                    <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      Showing {indexOfFirstImage + 1}-{Math.min(indexOfLastImage, images.length)} of {images.length} photos
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-red-500 dark:border-red-600">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Delete {selectedImages.size} Photo{selectedImages.size !== 1 ? 's' : ''}?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete <strong className="text-gray-900 dark:text-gray-100">{selectedImages.size} selected photo{selectedImages.size !== 1 ? 's' : ''}</strong>?
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    ⚠️ This action cannot be undone.<br />
                    Photos will be permanently deleted from storage.
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
                  Delete {selectedImages.size} Photo{selectedImages.size !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ImageCard({ 
  image, 
  onDelete, 
  isSelected, 
  onToggleSelection 
}: { 
  image: Image; 
  onDelete: (image: Image) => void;
  isSelected: boolean;
  onToggleSelection: (imageId: string) => void;
}) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImage();
  }, [image.file_path]);

  const loadImage = async () => {
    try {
      console.log('[ImageCard] Loading image:', image.file_name);

      // Use thumbnail if available, otherwise use full image
      const imagePath = image.thumbnail_path || image.file_path;
      console.log('[ImageCard] Using path:', imagePath, image.thumbnail_path ? '(thumbnail)' : '(full)');

      // First try to get public URL
      const { data } = supabase.storage
        .from('event-images')
        .getPublicUrl(imagePath);

      console.log('[ImageCard] Public URL generated:', data.publicUrl);

      // Check if the public URL works
      const response = await fetch(data.publicUrl, { method: 'HEAD' });
      console.log('[ImageCard] HEAD request status:', response.status);

      if (response.ok) {
        console.log('[ImageCard] Setting public URL');
        setImageUrl(data.publicUrl);
        // Don't set loading to false here - let onLoad handle it
      } else {
        console.warn('[ImageCard] Public URL failed with status:', response.status, 'trying signed URL');
        // Fallback to signed URL (24 hour expiry)
        const { data: signedData, error: signedError } = await supabase.storage
          .from('event-images')
          .createSignedUrl(imagePath, 86400); // 24 hours

        if (signedError) throw signedError;
        if (signedData) {
          console.log('[ImageCard] Using signed URL:', signedData.signedUrl);
          setImageUrl(signedData.signedUrl);
        }
      }
    } catch (err) {
      console.error('[ImageCard] Failed to load image:', err);
      setImageError(true);
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('event-images')
        .download(image.file_path);

      if (error) throw error;
      if (data) {
        downloadFile(data, image.file_name);
      }
    } catch (err) {
      alert('Failed to download image');
    }
  };

  return (
    <div className={`group relative aspect-square bg-gray-800 rounded-lg overflow-hidden ${
      isSelected ? 'ring-4 ring-orange-500 ring-offset-2' : ''
    }`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
          <div className="text-black-200 text-center">
            <div className="text-sm font-semibold">Loading...</div>
            <div className="text-xs mt-1">{imageUrl ? 'URL set' : 'Fetching URL'}</div>
          </div>
        </div>
      )}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
          <div className="text-red-400 text-center p-4">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-xs">Failed to load</div>
          </div>
        </div>
      )}
      {imageUrl && !imageError && (
        <img
          src={imageUrl}
          alt={image.file_name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('[ImageCard] <img> onError triggered for:', imageUrl);
            console.error('[ImageCard] Image element:', e.currentTarget);
            setImageError(true);
            setLoading(false);
          }}
          onLoad={(e) => {
            console.log('[ImageCard] <img> onLoad triggered successfully for:', image.file_name);
            console.log('[ImageCard] Image dimensions:', e.currentTarget.naturalWidth, 'x', e.currentTarget.naturalHeight);
            setLoading(false);
          }}
        />
      )}
      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelection(image.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-6 h-6 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer shadow-lg bg-white"
        />
      </div>
      <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-70 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
        <button
          onClick={downloadImage}
          className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg font-semibold transition-opacity pointer-events-auto shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Download image"
        >
          ⬇️ Download
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(image);
          }}
          className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-opacity pointer-events-auto shadow-lg"
          title="Delete image"
        >
          🗑️ Delete
        </button>
      </div>
      {image.uploaded_by && (
        <div className="absolute bottom-0 left-0 right-0 bg-opacity-70 text-white text-xs p-2">
          {image.uploaded_by}
        </div>
      )}
    </div>
  );
}
