# Generate Thumbnail Edge Function

This Supabase Edge Function generates WebP thumbnails for uploaded images server-side.

## Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Link to your project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Deploy the function

```bash
supabase functions deploy generate-thumbnail
```

### 4. Set environment variables (if not already set)

The function automatically has access to:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (auto-injected)

## Usage

Call from your client:

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/generate-thumbnail`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      imageId: 'uuid-of-image',
      filePath: 'event-id/photo_123.jpg',
      eventId: 'event-uuid'
    })
  }
);
```

## Image Processing

✅ **Production-ready!** This function uses Sharp for high-quality thumbnail generation.

The implementation:
- Resizes images to 400x400px (maintains aspect ratio)
- Converts to WebP format for optimal compression
- Quality set to 70% (great balance of size vs quality)
- Typical compression: 95-98% size reduction

### Configuration Options

You can adjust these parameters in the `generateThumbnail` function:

```typescript
.resize(400, 400, { 
  fit: 'inside',           // 'cover', 'contain', 'fill', 'inside', 'outside'
  withoutEnlargement: true // Don't upscale smaller images
})
.webp({ 
  quality: 70,             // 1-100 (higher = larger file, better quality)
  effort: 4                // 0-6 (higher = smaller file, slower processing)
})
```

### Alternative Formats

If you need different output formats:

```typescript
// JPEG instead of WebP
.jpeg({ quality: 80 })

// PNG (larger files, lossless)
.png({ compressionLevel: 9 })

// AVIF (newer format, smaller files, slower)
.avif({ quality: 65 })
```

## Cost Considerations

- **Free tier**: 500K invocations/month
- **Pro tier ($25/mo)**: 2M invocations/month
- See main docs for detailed cost breakdown

## Testing Locally

```bash
supabase functions serve generate-thumbnail
```

Then call from your app pointing to `http://localhost:54321/functions/v1/generate-thumbnail`

