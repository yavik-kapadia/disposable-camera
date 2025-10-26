-- Migration: Restrict image access to authenticated event creators only
-- This ensures only the event creator can view photos, while guests can still upload

-- Drop existing image read policy
DROP POLICY IF EXISTS "Anyone can read images from active events" ON images;

-- Create new restrictive policy: Only event creators can read images
CREATE POLICY "Only event creators can read their event images"
  ON images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = images.event_id
      AND events.creator_id = auth.uid()
    )
  );

-- Keep upload policy (guests can still upload)
-- The existing "Anyone can upload images to active events" policy remains

-- Update storage policies to restrict read access
-- Drop existing public read policy
DROP POLICY IF EXISTS "Public read access for event images" ON storage.objects;

-- Create new policy: Only authenticated users who own the event can read images
CREATE POLICY "Event creators can read their event images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'event-images' 
    AND auth.uid() IN (
      SELECT creator_id FROM events 
      WHERE id::text = (string_to_array(name, '/'))[1]::uuid
    )
  );

-- Keep upload and delete policies as they were (or restrict further if needed)
-- The existing upload policy allows anyone to upload, which is fine for guests

