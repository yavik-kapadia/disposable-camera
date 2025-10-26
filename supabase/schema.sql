-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  access_code TEXT NOT NULL UNIQUE,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ
);

-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by TEXT,
  caption TEXT,
  metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_access_code ON events(access_code);
CREATE INDEX IF NOT EXISTS idx_images_event_id ON images(event_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events table
-- Allow anyone to read active events
CREATE POLICY "Anyone can read active events"
  ON events FOR SELECT
  USING (is_active = true);

-- Only authenticated users can create events
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Only event creators can update their events
CREATE POLICY "Creators can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = creator_id);

-- RLS Policies for images table
-- Allow anyone to read images for active events
CREATE POLICY "Anyone can read images from active events"
  ON images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = images.event_id
      AND events.is_active = true
    )
  );

-- Allow anyone to insert images for active events
CREATE POLICY "Anyone can upload images to active events"
  ON images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
      AND events.is_active = true
    )
  );

-- Storage bucket for images
-- Note: The bucket must be created manually in the Supabase dashboard first
-- Then run the policies below

-- Storage bucket policies (run AFTER creating the 'event-images' bucket)
-- Allow public read access to all files
CREATE POLICY "Public read access for event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Allow public insert (upload) access
CREATE POLICY "Public upload access for event images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-images');

-- Allow public delete access (optional, for cleanup)
CREATE POLICY "Public delete access for event images"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-images');
