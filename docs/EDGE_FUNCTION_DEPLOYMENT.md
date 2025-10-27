# Edge Function Deployment Guide

This guide will walk you through deploying the thumbnail generation edge function to Supabase.

## Prerequisites

- Supabase project (you already have this)
- Node.js and npm installed
- Terminal/command line access

## Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

## Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window to authenticate with your Supabase account.

## Step 3: Link Your Project

You need your project reference ID. Find it in your Supabase dashboard URL:
```
https://supabase.com/dashboard/project/YOUR_PROJECT_REF
```

Link the project:
```bash
cd /Users/yavik/yavik.dev/disposable-camera
supabase link --project-ref YOUR_PROJECT_REF
```

Example:
```bash
supabase link --project-ref abcdefghijklmnop
```

## Step 4: Deploy the Edge Function

```bash
supabase functions deploy generate-thumbnail
```

You should see output like:
```
Deploying function generate-thumbnail...
Function deployed successfully!
Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-thumbnail
```

## Step 5: Verify Deployment

Test the function with curl:

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-thumbnail \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "imageId": "test-id",
    "filePath": "test/test.jpg",
    "eventId": "test-event"
  }'
```

You should get a response (might error if test file doesn't exist, but that's expected).

## Step 6: Run Database Migration

Apply the thumbnail column migration:

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents from `supabase/migration_add_thumbnails.sql`:

```sql
ALTER TABLE images
ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;

COMMENT ON COLUMN images.thumbnail_path IS 'Path to WebP thumbnail for faster gallery loading';

CREATE INDEX IF NOT EXISTS idx_images_thumbnail_path ON images(thumbnail_path);
```

5. Click **Run** or press `Cmd/Ctrl + Enter`

## Step 7: Configure Environment Variables (Optional)

The edge function automatically has access to:
- `SUPABASE_URL` - Auto-injected
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-injected

Your client app needs (should already be in `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 8: Test the Full Flow

1. Start your local dev server:
```bash
npm run dev
```

2. Navigate to an event and upload a photo
3. Check the browser console for logs about thumbnail generation
4. Verify in Supabase Storage that thumbnails are being created with `thumb_` prefix

## Troubleshooting

### Issue: "Missing required parameters"
**Solution**: Check that your client code is passing `imageId`, `filePath`, and `eventId`.

### Issue: "Failed to download image"
**Solution**: 
- Verify storage bucket policies allow the service role to read
- Check that the file path is correct
- Ensure the image was uploaded successfully before calling the function

### Issue: "Edge function not found"
**Solution**: 
- Re-deploy: `supabase functions deploy generate-thumbnail`
- Check function exists in Supabase dashboard under Edge Functions

### Issue: Local development
To test locally before deploying:

```bash
# Start local Supabase services
supabase start

# Serve the function locally
supabase functions serve generate-thumbnail

# Your function will be available at:
# http://localhost:54321/functions/v1/generate-thumbnail
```

Update your client code to use the local URL during development:
```typescript
const baseUrl = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:54321'
  : process.env.NEXT_PUBLIC_SUPABASE_URL;
```

## Important Note: Image Processing Library

The current edge function includes a placeholder for image processing. For production use, you need to implement actual thumbnail generation.

### Recommended: Add Image Processing

Update the edge function to use a real image processing library. Here are your options:

#### Option A: Sharp via esm.sh (Simplest)

Add this to the top of `supabase/functions/generate-thumbnail/index.ts`:

```typescript
import sharp from 'https://esm.sh/sharp@0.33.0';
```

Replace the `generateThumbnail` function with:

```typescript
async function generateThumbnail(imageBytes: Uint8Array, mimeType: string): Promise<Blob> {
  const resized = await sharp(imageBytes)
    .resize(400, 400, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .webp({ quality: 70 })
    .toBuffer();
  
  return new Blob([resized], { type: 'image/webp' });
}
```

Then redeploy:
```bash
supabase functions deploy generate-thumbnail
```

#### Option B: Use External Service

Services like Cloudinary or imgix can handle thumbnails. This costs extra but is very reliable.

## Monitoring

Monitor your edge function:
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** 
3. Click **generate-thumbnail**
4. View logs, invocation count, and errors

## Cost Monitoring

Keep an eye on:
- **Invocations**: Free tier = 500K/month
- **Compute time**: Shown in dashboard
- **Bandwidth**: Monitor in Storage section

Set up alerts in Supabase dashboard if you approach limits.

## Next Steps

1. ✅ Deploy the edge function
2. ✅ Test with a real upload
3. 🔄 Consider adding proper image processing library
4. 📊 Monitor usage in dashboard
5. 🎨 Optionally: Add image optimization features (blur placeholder, multiple sizes, etc.)

## Support

If you encounter issues:
- Check [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions)
- Review function logs in dashboard
- Test locally with `supabase functions serve`

