'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { compressImage, formatFileSize } from '@/utils/helpers';

interface ManualUploadProps {
  eventId: string;
  onUploadSuccess?: () => void;
}

export default function ManualUpload({ eventId, onUploadSuccess }: ManualUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [guestName, setGuestName] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = selectedFiles.length;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Compress image
        const compressedBlob = await compressImage(file);

        // Generate unique filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop() || 'jpg';
        const fileName = `photo_${timestamp}_${i}.${extension}`;
        const filePath = `${eventId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(filePath, compressedBlob, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Save metadata to database
        const { error: dbError } = await supabase.from('images').insert({
          event_id: eventId,
          file_path: filePath,
          file_name: fileName,
          uploaded_by: guestName || null,
          metadata: {
            timestamp,
            type: 'upload',
            originalName: file.name,
          },
        });

        if (dbError) throw dbError;

        // Update progress
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      // Reset form
      setSelectedFiles([]);
      setGuestName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      alert(`Successfully uploaded ${totalFiles} photo${totalFiles > 1 ? 's' : ''}!`);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Upload Photos</h2>

        <div className="space-y-4">
          {/* Guest Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name (Optional)
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="John Doe"
              disabled={uploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Photos
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Selected: {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm text-gray-600 bg-white rounded p-2"
                  >
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={uploadFiles}
            disabled={uploading || selectedFiles.length === 0}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length || ''} Photo${selectedFiles.length !== 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Tips:</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• You can select multiple photos at once</li>
            <li>• Photos will be compressed to save bandwidth</li>
            <li>• Add your name so others know who shared the photo</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
