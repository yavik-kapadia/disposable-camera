# Quick Fix: Storage RLS Error

If you're getting this error:
```
Upload error: StorageApiError: new row violates row-level security policy
```

## The Fix (2 minutes)

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**

### Step 2: Copy and Run This SQL

```sql
-- Storage bucket policies for event-images
-- Copy ALL of this and run it in SQL Editor

-- Allow public read access
CREATE POLICY "Public read access for event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Allow public upload access
CREATE POLICY "Public upload access for event images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-images');

-- Allow public delete access (optional)
CREATE POLICY "Public delete access for event images"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-images');
```

### Step 3: Click Run
- Click the **Run** button (or press Cmd/Ctrl + Enter)
- You should see "Success. No rows returned"

### Step 4: Test
- Go back to your app
- Refresh the page
- Try uploading a photo again
- ✅ It should work now!

## Verify It Worked

1. In Supabase, go to **Storage** > **event-images**
2. Click **Policies** tab
3. You should see 3 policies listed:
   - ✅ Public read access for event images (SELECT)
   - ✅ Public upload access for event images (INSERT)
   - ✅ Public delete access for event images (DELETE)

## Still Not Working?

See the full [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide.

### Common Additional Issues:

1. **Bucket doesn't exist**
   - Create it: Storage > New bucket > Name: `event-images` > Public: ✅

2. **Bucket not public**
   - Storage > event-images > Settings > Public bucket: ✅

3. **Wrong bucket name**
   - Must be exactly `event-images` (with hyphen, all lowercase)

---

That's it! Your uploads should work now. 🎉
