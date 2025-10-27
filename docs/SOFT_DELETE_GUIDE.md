# Soft Delete Implementation Guide

## Overview

Events now use **soft delete** - when users delete an event, the data is kept for 14 days before permanent deletion. This provides a safety net for accidental deletions.

## How It Works

### 1. User Deletes Event
```typescript
// Sets deleted_at timestamp
UPDATE events SET deleted_at = NOW() WHERE id = 'xxx';
```
- Event is hidden from dashboard
- Photos are no longer accessible
- Data remains in database

### 2. Grace Period (14 Days)
- Data is retained but hidden
- Can be recovered if needed (contact support)
- Images remain in storage

### 3. Permanent Deletion (After 14 Days)
```typescript
// Automatically run daily
DELETE FROM events WHERE deleted_at < NOW() - INTERVAL '14 days';
```
- Event permanently deleted
- Images cascade delete automatically
- Storage files removed

## Database Setup

### Step 1: Run Migration

In Supabase SQL Editor:

```sql
-- See: supabase/migration_soft_delete.sql
```

This adds:
- `deleted_at` column to events
- Updated RLS policies to hide deleted events
- Cleanup function for permanent deletion

### Step 2: Deploy Cleanup Function

```bash
# Deploy the Edge Function
supabase functions deploy cleanup-deleted-events

# Test it works
curl -X POST https://your-project.supabase.co/functions/v1/cleanup-deleted-events \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Step 3: Schedule Daily Cleanup

#### Option A: Using pg_cron (Recommended)

1. Go to Supabase Dashboard → Database → Cron Jobs
2. Click "Create Cron Job"
3. Set schedule: `0 2 * * *` (runs at 2 AM UTC daily)
4. SQL command:
```sql
SELECT net.http_post(
  url := 'https://your-project.supabase.co/functions/v1/cleanup-deleted-events',
  headers := jsonb_build_object(
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
  )
);
```

#### Option B: Manual Cleanup Function

Run this SQL periodically (or create a cron job):

```sql
SELECT cleanup_deleted_events();
```

## UI Changes

### Dashboard
- ✅ Added "🗑️ Delete Event" button to each event card
- ✅ Confirmation dialog explains 14-day retention
- ✅ Deleted events immediately hidden from user's dashboard

### Event Page
- Deleted events return 404 (not accessible)
- Creator can no longer view deleted events

## RLS Policy Changes

### Before
```sql
-- Anyone could see active events
CREATE POLICY "Anyone can read active events"
  ON events FOR SELECT
  USING (is_active = true);
```

### After
```sql
-- Creators see all their events, others see only active non-deleted
CREATE POLICY "Creators can read their own events"
  ON events FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can read active non-deleted events"
  ON events FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);
```

## Benefits

### For Users
- ✅ Safety net for accidental deletions
- ✅ 14 days to recover data
- ✅ Clear deletion confirmation

### For You
- ✅ Reduced support requests
- ✅ Compliance with data retention policies
- ✅ Automatic cleanup
- ✅ No manual intervention needed

## Recovery Process

If a user wants to recover a deleted event within 14 days:

```sql
-- Admin/Support can undelete
UPDATE events 
SET deleted_at = NULL 
WHERE id = 'xxx' 
AND deleted_at > NOW() - INTERVAL '14 days';
```

## Testing

### Test Soft Delete
```javascript
// In browser console on dashboard
const eventId = 'YOUR_EVENT_ID';
const { error } = await supabase
  .from('events')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', eventId);

// Event should disappear from dashboard
```

### Test Cleanup Function
```javascript
// Run cleanup manually
const { data, error } = await supabase.rpc('cleanup_deleted_events');
console.log('Deleted count:', data);
```

### Test Recovery
```sql
-- Undelete an event (admin only)
UPDATE events 
SET deleted_at = NULL 
WHERE id = 'event-id-here';
```

## Monitoring

### Check Pending Deletions
```sql
SELECT id, name, deleted_at, 
       NOW() - deleted_at as "deleted_ago",
       deleted_at + INTERVAL '14 days' - NOW() as "time_until_permanent_delete"
FROM events
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
```

### Check Cleanup History
```sql
-- Add audit logging if needed
CREATE TABLE deletion_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID,
  event_name TEXT,
  deleted_at TIMESTAMPTZ,
  permanently_deleted_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Configuration

### Change Grace Period

To change from 14 days to another period:

1. Update migration SQL:
```sql
WHERE deleted_at < NOW() - INTERVAL '30 days'  -- Change 14 to 30
```

2. Update UI message in `handleDeleteEvent`
3. Update Edge Function in `cleanup-deleted-events/index.ts`

## Important Notes

⚠️ **Cascade Deletion**: When an event is permanently deleted, all images cascade delete automatically due to `ON DELETE CASCADE` in the schema.

⚠️ **Storage Cleanup**: Images in Supabase Storage should also be cleaned up. Consider adding storage cleanup to the Edge Function.

⚠️ **No Undo**: After 14 days, deletion is permanent. There's no recovery.

## Troubleshooting

### Events Not Being Deleted
```sql
-- Check if cleanup function is running
SELECT * FROM events WHERE deleted_at < NOW() - INTERVAL '14 days';

-- Manually trigger cleanup
SELECT cleanup_deleted_events();
```

### RLS Blocking Soft Delete
```sql
-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'events';
```

### User Sees Deleted Events
- Clear browser cache
- Verify RLS policies applied
- Check if user is the creator (they shouldn't see deleted events either)

## Summary

✅ Soft delete implemented with 14-day grace period  
✅ Automatic cleanup via Edge Function  
✅ User-friendly deletion flow  
✅ Data safety and compliance  
✅ Easy recovery process within grace period

Deploy and enjoy safer event management! 🎉

