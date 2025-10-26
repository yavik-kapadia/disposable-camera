# Disposable Camera 📸

A modern web application for crowd-sourcing photos from event attendees. Built with Next.js and Supabase, this app allows guests to easily capture and share photos from events using a virtual "disposable camera" experience.

> **🚨 Getting an upload error?** See [QUICK_FIX_RLS.md](./QUICK_FIX_RLS.md) for the 2-minute fix!

## Features

- **Event Creation**: Create events with unique access codes
- **QR Code Sharing**: Generate QR codes for easy event access
- **Camera Capture**: Use device camera to take photos directly in the browser
- **Auto-Upload & Save**: Photos are automatically uploaded to the cloud and saved to the user's device
- **Manual Upload**: Upload existing photos from device gallery
- **Real-time Updates**: See new photos appear in real-time as guests upload them
- **Bulk Download**: Event creators can download all photos as a ZIP file
- **Server-Side Thumbnails**: Fast-loading WebP thumbnails generated automatically via Edge Functions
- **Guest Names**: Optional guest identification on uploaded photos
- **Mobile-First Design**: Responsive design optimized for mobile devices
- **Privacy Controls**: Event creators can close events to stop new uploads

## Tech Stack

- **Frontend**: Next.js 15 with App Router, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Storage + Edge Functions)
- **QR Code**: qrcode library
- **File Handling**: JSZip for bulk downloads
- **Image Processing**: Server-side thumbnail generation (WebP)

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works great!)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd disposable-camera
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to be provisioned (takes ~2 minutes)

#### Set Up Database Tables

1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy the contents of [supabase/schema.sql](./supabase/schema.sql)
3. Paste and run the SQL script to create the tables and policies

#### Set Up Storage Bucket

1. In your Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Create a bucket named `event-images`
4. Make it **Public**
5. (Optional) Set file size limit to 10MB

#### Configure Storage Policies

In the Storage bucket settings, add these policies:

**For SELECT (read):**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');
```

**For INSERT (upload):**
```sql
CREATE POLICY "Public upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-images');
```

### 3. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. In your Supabase dashboard, go to **Settings** > **API**
3. Copy your **Project URL** and **anon/public** key
4. Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Deploy Edge Function (Optional but Recommended)

For optimal performance with server-side thumbnail generation:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy generate-thumbnail
```

> **📋 Full deployment guide**: See [EDGE_FUNCTION_DEPLOYMENT.md](./docs/EDGE_FUNCTION_DEPLOYMENT.md) for complete instructions.
>
> **Note**: The app works without this step, but thumbnails won't be generated. See [THUMBNAIL_ARCHITECTURE.md](./docs/THUMBNAIL_ARCHITECTURE.md) for details.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **📱 Testing on Mobile?** See [LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md) for:
> - Using your local network IP (e.g., `http://192.168.1.100:3000`)
> - Setting up custom HTTPS domain (e.g., `https://cam.local.yavik.dev`)
> - Running the camera feature on mobile devices

## Usage Guide

### For Event Creators

1. **Create an Event**
   - Go to the home page
   - Fill in event name, description (optional), and your name (optional)
   - Click "Create Event"

2. **Share with Guests**
   - You'll be redirected to the event dashboard
   - Share the QR code or access code with guests
   - Guests can scan the QR code or manually enter the code

3. **View Photos**
   - All uploaded photos appear in real-time on the dashboard
   - Click on any photo to download it individually

4. **Download All Photos**
   - Click "Download All" to get a ZIP file of all event photos
   - Photos are organized with timestamps

5. **Close Event**
   - Click "Close Event" to prevent new uploads
   - You can reopen it later if needed

### For Guests

1. **Join an Event**
   - Scan the QR code OR enter the access code on the home page
   - You'll be redirected to the camera page

2. **Take Photos**
   - Click "Camera" tab
   - Grant camera permissions when prompted
   - Click the white circle to capture
   - Photos are automatically saved to your device AND uploaded

3. **Upload Existing Photos**
   - Click "Upload" tab
   - Add your name (optional)
   - Select one or more photos from your gallery
   - Click "Upload Photos"

## Project Structure

```
disposable-camera/
├── app/
│   ├── camera/[code]/     # Guest camera/upload page
│   ├── event/[id]/        # Event dashboard for creators
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (create/join events)
├── components/
│   ├── CameraCapture.tsx  # Camera capture component
│   ├── ManualUpload.tsx   # File upload component
│   └── QRCodeGenerator.tsx # QR code generator
├── lib/
│   └── supabase.ts        # Supabase client
├── types/
│   └── database.ts        # TypeScript types for database
├── utils/
│   └── helpers.ts         # Utility functions
├── supabase/
│   └── schema.sql         # Database schema
└── public/                # Static assets
```

## Database Schema

### Events Table
- `id` (UUID) - Primary key
- `created_at` (timestamp) - Creation timestamp
- `name` (text) - Event name
- `description` (text) - Event description
- `access_code` (text) - Unique 8-character code
- `creator_name` (text) - Optional creator name
- `is_active` (boolean) - Event status
- `expires_at` (timestamp) - Optional expiration

### Images Table
- `id` (UUID) - Primary key
- `created_at` (timestamp) - Upload timestamp
- `event_id` (UUID) - Foreign key to events
- `file_path` (text) - Storage path for full-size image
- `file_name` (text) - File name
- `thumbnail_path` (text) - Storage path for WebP thumbnail
- `uploaded_by` (text) - Optional guest name
- `caption` (text) - Optional caption
- `metadata` (jsonb) - Additional metadata

## Features in Detail

### Server-Side Thumbnail Generation
Photos are processed on the server to generate optimized WebP thumbnails (400px, ~70KB) for fast gallery loading. This provides:
- **Faster uploads** - Users only upload the full image
- **Better mobile performance** - No CPU-intensive processing on phone
- **Reduced bandwidth** - Thumbnails load 10x faster than full images
- **Automatic processing** - Happens in background after upload

See [THUMBNAIL_ARCHITECTURE.md](./docs/THUMBNAIL_ARCHITECTURE.md) for technical details.

### Image Compression
All uploaded images are automatically compressed to reduce bandwidth and storage usage while maintaining good quality.

### Real-time Updates
The event dashboard uses Supabase real-time subscriptions to show new photos as they're uploaded without requiring page refresh.

### Local Storage
Photos taken with the camera are automatically downloaded to the user's device in addition to being uploaded to the cloud.

### Camera Controls
- Switch between front/back cameras
- Full-screen camera preview
- Visual flash effect on capture
- Start/stop camera controls

### Security
- Row Level Security (RLS) policies protect data
- Public bucket with controlled access
- No authentication required for simplicity
- Access code system for event privacy

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables from `.env.local`
5. Update `NEXT_PUBLIC_APP_URL` to your Vercel domain
6. Deploy!

### Important: Update CORS Settings

After deployment, update your Supabase Storage CORS settings to allow your domain.

## Troubleshooting

> **For detailed troubleshooting, see [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)**

### Most Common Issues

#### 🔴 Upload Error: "new row violates row-level security policy"
**Solution**: You need to add Storage Policies. See [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md#-upload-error-storageapierror-new-row-violates-row-level-security-policy) for detailed fix.

#### Camera Not Working
- Ensure you're using HTTPS (required for camera access)
- Check browser permissions for camera access
- Try a different browser (Chrome/Safari recommended)

#### Images Not Uploading
- **Most common**: Missing Storage Policies (see link above)
- Verify Supabase environment variables are correct
- Check Storage bucket is public
- Check browser console for errors

#### QR Code Not Working
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly
- QR code should point to `/camera/[ACCESS_CODE]`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your events!

## Support

If you encounter any issues, please open an issue on GitHub.
