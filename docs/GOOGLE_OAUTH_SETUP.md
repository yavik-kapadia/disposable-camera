# Google OAuth Setup Guide

This guide walks you through configuring Google OAuth authentication for the Disposable Camera app.

## Prerequisites

- Supabase project set up (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
- Google account for creating OAuth credentials

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - User Type: **External**
   - App name: **Disposable Camera** (or your choice)
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue** through the remaining steps

6. Back to creating OAuth client ID:
   - Application type: **Web application**
   - Name: **Disposable Camera Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production URL (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
     - Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference

7. Click **Create**
8. Copy the **Client ID** and **Client Secret** - you'll need these for Supabase

## Step 2: Configure Google OAuth in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers** in the left sidebar
4. Find **Google** in the list and click to expand
5. Toggle **Enable Sign in with Google** to ON
6. Fill in the credentials:
   - **Client ID**: Paste the Client ID from Google
   - **Client Secret**: Paste the Client Secret from Google
7. Copy the **Callback URL** shown in Supabase (you added this to Google already)
8. Click **Save**

## Step 3: Update Your Database Schema

If you have an **existing database**, run the migration:

```sql
-- Run this in Supabase SQL Editor
-- Navigate to: SQL Editor > New query > Paste and Run
```

Copy and paste the contents of `supabase/migration_add_auth.sql`

If you're **setting up a new database**, just run the updated `supabase/schema.sql` file which already includes authentication support.

## Step 4: Test the Authentication Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)

3. You should see:
   - **Create Event** section with "Sign in with Google" button
   - **Join Event** section (no auth required for guests)

4. Click **Sign in with Google**
   - You'll be redirected to Google's OAuth consent screen
   - Sign in with your Google account
   - Grant permissions
   - You'll be redirected back to your app

5. After signing in:
   - You should see "Signed in as your-email@gmail.com"
   - The event creation form should now be visible
   - Try creating an event to test the full flow

## Step 5: Production Deployment

When deploying to production:

1. **Update Google OAuth Credentials**:
   - Go back to [Google Cloud Console](https://console.cloud.google.com/)
   - Edit your OAuth client
   - Add your production domain to:
     - Authorized JavaScript origins: `https://yourdomain.com`
     - Keep the Supabase callback URL unchanged

2. **Update Environment Variables**:
   - Make sure your production environment has the correct Supabase credentials
   - No changes needed to `.env` for Google OAuth (it's configured in Supabase)

3. **Test in Production**:
   - Try signing in with Google on your production site
   - Create a test event
   - Verify the event dashboard works correctly

## Troubleshooting

### "Error 400: redirect_uri_mismatch"

- Check that the redirect URI in Google Cloud Console matches exactly:
  `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
- Make sure there are no trailing slashes or typos

### "Sign in with Google" button doesn't work

- Check browser console for errors
- Verify Google OAuth is enabled in Supabase > Authentication > Providers
- Confirm Client ID and Client Secret are correct

### "Failed to create event" after signing in

- Check that the database migration ran successfully
- Verify the `creator_id` column exists in the `events` table
- Check Supabase logs for RLS policy errors

### Authentication callback redirects to wrong URL

- Check that `NEXT_PUBLIC_APP_URL` is set correctly in your `.env` file
- In production, this should be your production domain

## Security Considerations

- Only authenticated users can create events
- Only event creators can update their own events
- Guests can join events and upload photos without authentication
- Event access codes provide security for guest uploads
- Google OAuth provides secure, industry-standard authentication

## Next Steps

- Users can now create and manage their events
- Guests can still join events without signing in
- Consider adding user profile management
- Consider adding event expiration/archiving features
