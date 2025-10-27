# Troubleshooting Guide

## Common Issues and Solutions

### 🔴 "Upload error: StorageApiError: new row violates row-level security policy"

**Problem**: Photos fail to upload with RLS policy error.

**Cause**: Storage bucket policies are not configured correctly.

**Solution**:

#### Step 1: Verify Bucket Exists
1. Go to Supabase Dashboard
2. Click **Storage** in left sidebar
3. Verify `event-images` bucket exists
4. Verify it's set to **Public**

#### Step 2: Add Storage Policies

**Option A: Using SQL Editor (Recommended)**

1. Go to **SQL Editor** in Supabase
2. Click **New query**
3. Copy and paste this SQL:

```sql
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

4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success" message

**Option B: Using Storage UI**

1. Go to **Storage** > **event-images**
2. Click **Policies** tab
3. Click **New Policy** button

**For READ policy:**
- Template: Create a policy from scratch
- Policy name: `Public read access for event images`
- Allowed operation: **SELECT**
- Target roles: Leave default (all roles)
- USING expression: `bucket_id = 'event-images'`
- Click **Review** then **Save policy**

**For INSERT policy:**
- Template: Create a policy from scratch
- Policy name: `Public upload access for event images`
- Allowed operation: **INSERT**
- Target roles: Leave default (all roles)
- WITH CHECK expression: `bucket_id = 'event-images'`
- Click **Review** then **Save policy**

**For DELETE policy (optional):**
- Template: Create a policy from scratch
- Policy name: `Public delete access for event images`
- Allowed operation: **DELETE**
- Target roles: Leave default (all roles)
- USING expression: `bucket_id = 'event-images'`
- Click **Review** then **Save policy**

#### Step 3: Verify Policies
1. Go to **Storage** > **event-images** > **Policies**
2. You should see 3 policies listed:
   - Public read access for event images (SELECT)
   - Public upload access for event images (INSERT)
   - Public delete access for event images (DELETE)

#### Step 4: Test Upload
1. Refresh your app
2. Try uploading a photo again
3. It should work now!

---

### 🔴 "Failed to create event"

**Problem**: Event creation fails.

**Possible Causes & Solutions**:

#### 1. Environment Variables Not Set
- Check `.env.local` exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Restart dev server after changing env variables

#### 2. Database Schema Not Run
- Go to Supabase **SQL Editor**
- Run the contents of `supabase/schema.sql`
- Verify tables exist in **Table Editor**

#### 3. RLS Policies Missing
```sql
-- Run this in SQL Editor
CREATE POLICY "Anyone can create events"
ON events FOR INSERT
WITH CHECK (true);
```

---

### 🔴 Camera Not Working

**Problem**: Camera doesn't start or shows black screen.

**Common Errors**:
- `TypeError: undefined is not an object (evaluating 'navigator.mediaDevices.getUserMedia')`
- `Camera API not available`
- `Failed to access camera`

**Solutions**:

#### 1. Check HTTPS
- Camera API requires HTTPS (or localhost)
- In development: `http://localhost:3000` works
- In production: **Must use `https://your-domain.com`**
- HTTP (non-secure) will NOT work in production

#### 2. Check Browser Permissions
- Click the 🔒 icon in address bar
- Ensure Camera permission is set to "Allow"
- Some browsers require you to grant permission on first use
- Try a different browser (Chrome/Safari recommended)

#### 3. Check Browser Support
- Minimum versions:
  - Chrome 53+
  - Safari 11+
  - Firefox 36+
- Mobile Safari requires iOS 14.3+
- Some older browsers don't support getUserMedia

#### 4. Try Incognito/Private Mode
- Sometimes extensions block camera
- Test in incognito mode to rule this out

#### 5. Use Upload Instead
- If camera continues to fail, use the **Upload** tab
- You can still select and upload photos from your gallery
- Works on all browsers without camera permissions

---

### 🔴 "Event not found" Error

**Problem**: Joining event with access code fails.

**Possible Causes**:

#### 1. Wrong Access Code
- Verify code is exactly 8 characters
- Codes are case-sensitive (auto-converted to uppercase)
- Check for typos (O vs 0, I vs 1, etc.)

#### 2. Event is Closed
- Event creator may have closed the event
- Check if `is_active = false` in database
- Contact event creator to reopen

#### 3. Database Connection Issue
- Check browser console for errors
- Verify Supabase credentials
- Check Supabase project status

---

### 🔴 Images Not Displaying in Gallery

**Problem**: Photos upload but don't show in gallery.

**Solutions**:

#### 1. Bucket Not Public
1. Go to Supabase **Storage**
2. Click on `event-images` bucket
3. Click settings (gear icon)
4. Ensure **Public bucket** is checked
5. Click **Save**

#### 2. Clear Cache
- Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
- Check in incognito mode

#### 3. Check Image URLs
- Open browser console
- Look for 404 errors on images
- Verify storage path is correct

---

### 🔴 Download ZIP Fails

**Problem**: Bulk download doesn't work or fails partway.

**Solutions**:

#### 1. Too Many Images
- ZIP generation is memory-intensive
- Try with fewer images first
- Consider downloading in batches

#### 2. Network Timeout
- Slow connection may timeout
- Try again with better internet
- Download individual images instead

#### 3. Browser Limitations
- Some browsers limit file size
- Try a different browser
- Use desktop instead of mobile

---

### 🔴 Real-time Updates Not Working

**Problem**: New photos don't appear without refresh.

**Solutions**:

#### 1. Check Supabase Realtime
1. Go to Supabase Dashboard
2. **Database** > **Replication**
3. Ensure `images` table has replication enabled

#### 2. Check Connection
- Look for errors in browser console
- Verify stable internet connection
- Refresh the page

#### 3. Verify Subscription Code
- Check no errors in console related to channels
- Verify event ID is correct

---

### 🔴 Build Errors

**Problem**: `npm run build` fails.

**Solutions**:

#### TypeScript Errors
```bash
# Delete build artifacts and try again
rm -rf .next
npm run build
```

#### Missing Dependencies
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Environment Variables in Build
- Build uses placeholder values by default
- Real values only needed at runtime
- Ensure no hardcoded credentials

---

### 🔴 QR Code Scans to Wrong URL

**Problem**: QR code opens wrong website or localhost.

**Solutions**:

#### 1. Update APP_URL
In `.env.local` or Vercel environment variables:
```env
NEXT_PUBLIC_APP_URL=https://your-actual-domain.com
```

#### 2. Redeploy
- Changes to env variables require rebuild
- In Vercel: trigger new deployment
- Locally: restart dev server

#### 3. Generate New QR Code
- Create a new test event
- New events will use updated URL

---

## Getting More Help

### Before Asking for Help

1. **Check Browser Console**
   - Press F12 or Cmd+Option+I
   - Look at Console tab for errors
   - Copy exact error message

2. **Check Supabase Logs**
   - Go to Supabase Dashboard
   - **Logs** > **Database** or **Storage**
   - Look for recent errors

3. **Verify Setup Steps**
   - Review [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - Confirm each step was completed
   - Try setup again from scratch

### How to Report Issues

When asking for help, include:

1. **What you're trying to do**
2. **What's happening instead**
3. **Exact error message** (screenshot or copy/paste)
4. **Browser console errors** (if any)
5. **Steps to reproduce**
6. **Your environment**:
   - Browser and version
   - Operating system
   - Local dev or production
   - Node.js version

### Useful Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Clear Next.js cache
rm -rf .next

# Clear all caches and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run dev

# Build for production
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

---

## Quick Reference

### Supabase Setup Checklist
- [ ] Project created
- [ ] Database schema run (tables + policies)
- [ ] Storage bucket created (`event-images`)
- [ ] Storage bucket set to Public
- [ ] Storage policies added (SELECT, INSERT, DELETE)
- [ ] API credentials copied

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

### Common SQL Queries

**Check if events table exists:**
```sql
SELECT * FROM events LIMIT 1;
```

**Check if images table exists:**
```sql
SELECT * FROM images LIMIT 1;
```

**List all events:**
```sql
SELECT id, name, access_code, is_active FROM events;
```

**List all images for an event:**
```sql
SELECT * FROM images WHERE event_id = 'your-event-id';
```

**Check storage policies:**
```sql
SELECT * FROM storage.objects WHERE bucket_id = 'event-images';
```

---

Still stuck? Check the other documentation files:
- [README.md](./README.md) - Full documentation
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Detailed Supabase guide
- [QUICKSTART.md](./QUICKSTART.md) - Quick setup guide
