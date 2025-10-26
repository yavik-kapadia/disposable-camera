-- Migration: Add authentication support to existing database
-- Run this if you already have an existing events table

-- Add creator_id column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for events
-- Drop old policies
DROP POLICY IF EXISTS "Anyone can create events" ON events;
DROP POLICY IF EXISTS "Anyone can update events" ON events;

-- Create new policies
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = creator_id);

-- Note: The "Anyone can read active events" policy remains unchanged
