-- Migration: Implement soft delete with 14-day grace period
-- Events are marked as deleted but data remains for 14 days

-- Add deleted_at column to track soft deletes
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events(deleted_at) WHERE deleted_at IS NOT NULL;

-- Drop existing policies to recreate them with soft delete support
DROP POLICY IF EXISTS "Anyone can read active events" ON events;
DROP POLICY IF EXISTS "Creators can update their own events" ON events;
DROP POLICY IF EXISTS "Creators can delete their own events" ON events;

-- Policy: Users can only see their own events (active, inactive, or soft-deleted)
CREATE POLICY "Creators can read their own events"
  ON events FOR SELECT
  USING (auth.uid() = creator_id);

-- Policy: Allow other users to see only active, non-deleted events
CREATE POLICY "Anyone can read active non-deleted events"
  ON events FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);

-- Policy: Creators can update their events (including soft delete)
CREATE POLICY "Creators can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = creator_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = creator_id);

-- Policy: Only allow hard delete via service role (for cleanup function)
-- Users cannot hard delete, only soft delete via UPDATE
CREATE POLICY "Service role can delete old events"
  ON events FOR DELETE
  USING (deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '14 days');

-- Update images policy to exclude soft-deleted events
DROP POLICY IF EXISTS "Anyone can read images from active events" ON images;

CREATE POLICY "Anyone can read images from active non-deleted events"
  ON images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = images.event_id
      AND events.is_active = true
      AND events.deleted_at IS NULL
    )
  );

-- Update image upload policy
DROP POLICY IF EXISTS "Anyone can upload images to active events" ON images;

CREATE POLICY "Anyone can upload images to active non-deleted events"
  ON images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
      AND events.is_active = true
      AND events.deleted_at IS NULL
    )
  );

-- Create function to permanently delete old soft-deleted events
CREATE OR REPLACE FUNCTION cleanup_deleted_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete events that were soft-deleted more than 14 days ago
  WITH deleted_events AS (
    DELETE FROM events
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '14 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted_events;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for testing)
GRANT EXECUTE ON FUNCTION cleanup_deleted_events() TO authenticated;

COMMENT ON FUNCTION cleanup_deleted_events() IS 'Permanently deletes events that were soft-deleted more than 14 days ago. Images cascade delete automatically.';

