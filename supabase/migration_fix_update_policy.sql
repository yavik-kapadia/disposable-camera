-- Migration: Fix UPDATE policy to include WITH CHECK clause
-- This ensures both reading and writing checks pass for updates

-- Drop existing update policy
DROP POLICY IF EXISTS "Creators can update their own events" ON events;

-- Recreate with both USING and WITH CHECK
CREATE POLICY "Creators can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Also add a DELETE policy if it doesn't exist
DROP POLICY IF EXISTS "Creators can delete their own events" ON events;

CREATE POLICY "Creators can delete their own events"
  ON events FOR DELETE
  USING (auth.uid() = creator_id);

