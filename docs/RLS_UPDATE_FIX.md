# Fix for 403 Error on Event Update

## Problem
When clicking "Close Event" button, you get:
```
PATCH https://uhvfrypgsrhgawvedguc.supabase.co/rest/v1/events?id=eq.xxx 403 (Forbidden)
```

## Root Cause
The RLS policy for updating events was missing the `WITH CHECK` clause. In PostgreSQL RLS:
- `USING` checks if you can see/read the row
- `WITH CHECK` checks if you can write/update the row

For UPDATE operations, you need both!

## Solution

Run this SQL in your Supabase SQL Editor:

```sql
-- Drop existing update policy
DROP POLICY IF EXISTS "Creators can update their own events" ON events;

-- Recreate with both USING and WITH CHECK
CREATE POLICY "Creators can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Also add DELETE policy
DROP POLICY IF EXISTS "Creators can delete their own events" ON events;

CREATE POLICY "Creators can delete their own events"
  ON events FOR DELETE
  USING (auth.uid() = creator_id);
```

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Paste the SQL above
5. Click **Run**

### Option 2: Via Migration File
```bash
# The migration file is at:
supabase/migration_fix_update_policy.sql

# Run it in Supabase SQL Editor
```

## Verify the Fix

After running the migration:

1. Go to your app's dashboard
2. Click on an event to view it
3. Click "Close Event" button
4. ✅ Should work without 403 error!

## What Changed

### Before ❌
```sql
CREATE POLICY "Creators can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = creator_id);
  -- Missing WITH CHECK!
```

### After ✅
```sql
CREATE POLICY "Creators can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);
  -- Both clauses present!
```

## Why This Matters

**USING** = "Can you see this row?"
- Checks when reading (SELECT)
- Checks which rows you can potentially update

**WITH CHECK** = "Can you write this data?"
- Checks when writing (INSERT/UPDATE)
- Verifies the new data meets security requirements

For UPDATE operations:
1. USING checks if you can access the existing row
2. WITH CHECK ensures you have permission to write the new values

Without WITH CHECK, PostgreSQL blocks the update for security!

## Additional Notes

- This also adds a DELETE policy for future use
- The fix is backwards compatible
- No data migration needed
- Takes effect immediately after running

## Test the Fix

```javascript
// In browser console on event page:
const { data, error } = await supabase
  .from('events')
  .update({ is_active: false })
  .eq('id', 'YOUR_EVENT_ID')
  .select();

// Should return success without 403 error
console.log(data, error);
```

Happy event managing! 🎉

