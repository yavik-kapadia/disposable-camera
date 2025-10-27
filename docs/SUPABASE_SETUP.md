# Supabase Setup Guide

This guide will walk you through setting up Supabase for the Disposable Camera app.

> **⚠️ IMPORTANT**: The most common issue is forgetting to set up Storage Policies.
> Make sure you complete **Step 5** (Configure Storage Policies) or uploads will fail with an RLS error!

## Step 1: Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email

## Step 2: Create a New Project

1. Click "New Project"
2. Choose your organization (or create one)
3. Fill in project details:
   - **Name**: disposable-camera (or your choice)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

## Step 3: Set Up Database Tables

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy and paste the entire contents of `supabase/schema.sql` from this repository
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

### Verify Tables Created

1. Click **Table Editor** in the left sidebar
2. You should see two tables:
   - `events` - Stores event information
   - `images` - Stores image metadata

## Step 4: Create Storage Bucket

1. Click **Storage** in the left sidebar
2. Click **New bucket**
3. Enter bucket details:
   - **Name**: `event-images` (must be exactly this!)
   - **Public bucket**: ✅ Yes (check this box)
   - **File size limit**: 10485760 (10MB - optional)
4. Click **Create bucket**

## Step 5: Configure Storage Policies

### Option A: Using SQL Editor (Recommended)

1. Go back to **SQL Editor**
2. Create a new query
3. Paste and run this SQL:

```sql
-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Allow public upload access
CREATE POLICY "Public upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-images');

-- Allow public delete access (for cleanup)
CREATE POLICY "Public delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-images');
```

### Option B: Using Storage UI

1. Go to **Storage** > **event-images**
2. Click **Policies** tab
3. Click **New Policy**

**For READ access:**
- Policy name: `Public read access`
- Allowed operation: `SELECT`
- Policy definition: `true`
- Click **Review** then **Save**

**For INSERT access:**
- Policy name: `Public upload access`
- Allowed operation: `INSERT`
- Policy definition: `true`
- Click **Review** then **Save**

## Step 6: Get Your API Credentials

1. Click **Settings** in the left sidebar (gear icon at bottom)
2. Click **API** under Project Settings
3. Find these two values:

   - **Project URL**: `https://xxxxx.supabase.co`
   - **Project API keys** > **anon/public**: `eyJhbG...` (long string)

4. Copy these values - you'll need them for your `.env.local` file

## Step 7: Configure Environment Variables

1. In your project root, copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and update with your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 8: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)

3. Try creating a test event:
   - Fill in event name: "Test Event"
   - Click "Create Event"
   - If successful, you'll be redirected to the event dashboard

4. Verify in Supabase:
   - Go to **Table Editor** > **events**
   - You should see your test event

## Troubleshooting

### "Failed to create event"
- Check that your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Verify the SQL schema ran successfully
- Check browser console for specific errors

### "Failed to upload image"
- Verify storage bucket is named exactly `event-images`
- Check that bucket is set to **Public**
- Verify storage policies are created correctly
- Check bucket policies in Storage > event-images > Policies

### Images not displaying
- Ensure bucket is **Public**
- Check that the SELECT policy exists
- Verify the image was uploaded (Storage > event-images > browse files)

### Database connection errors
- Ensure project is fully provisioned (check dashboard)
- Verify environment variables are loaded (restart dev server)
- Check Supabase project status (supabase.com dashboard)

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add the same environment variables to your hosting platform
2. Update `NEXT_PUBLIC_APP_URL` to your production domain
3. (Optional) Update Supabase CORS settings:
   - Go to **Settings** > **API** > **CORS**
   - Add your production domain

## Security Considerations

This app uses **anonymous access** for simplicity. The database and storage are protected by:

1. **Row Level Security (RLS)**: Only active events can receive uploads
2. **Access Codes**: Events require unique codes to access
3. **Storage Policies**: Scoped to specific bucket
4. **No Authentication**: Reduces friction for event guests

For production use with sensitive data, consider:
- Adding authentication for event creators
- Implementing rate limiting
- Adding image moderation
- Setting event expiration dates

## Next Steps

- Read the main [README.md](./README.md) for usage instructions
- Test the camera feature (requires HTTPS in production)
- Customize the app for your needs
- Deploy to production!

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Project GitHub Issues](../../issues)
