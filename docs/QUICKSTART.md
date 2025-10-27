# Quick Start Guide

Get your Disposable Camera app running in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- A Supabase account (free)

## Setup Steps

### 1. Install Dependencies (1 min)
```bash
npm install
```

### 2. Set Up Supabase (2 min)

1. Go to [supabase.com](https://supabase.com) and create a project
2. In SQL Editor, run the contents of `supabase/schema.sql`
3. In Storage, create a **public** bucket named `event-images`
4. Add storage policies (see SUPABASE_SETUP.md for details)

### 3. Configure Environment (1 min)

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials:
# - NEXT_PUBLIC_SUPABASE_URL (from Supabase Settings > API)
# - NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase Settings > API)
```

### 4. Run the App (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test It Out

### Create Your First Event
1. Enter an event name (e.g., "Test Party")
2. Click "Create Event"
3. You'll see your event dashboard with a QR code

### Take a Photo
1. Copy the access code from the dashboard
2. Open a new tab and go to home page
3. Enter the access code and click "Join Event"
4. Click "Camera" and grant camera permissions
5. Take a photo - it saves to your device AND uploads!

### View Photos
1. Go back to the event dashboard
2. Your photo should appear in real-time
3. Click "Download All" to get a ZIP file

## What You Get

✅ Event creation with unique codes
✅ QR code generation
✅ Camera capture with auto-save
✅ Manual photo upload
✅ Real-time photo updates
✅ Bulk download as ZIP
✅ Mobile-responsive design

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for troubleshooting
- Deploy to Vercel for production use
- Customize colors and styling in the components

## Common Issues

**Camera not working?**
- Camera requires HTTPS (works on localhost for dev)
- Check browser permissions

**Upload failing?**
- Verify storage bucket is named `event-images`
- Check that bucket is set to public
- Verify environment variables are correct

**Events not appearing?**
- Check that SQL schema ran successfully
- Look at browser console for errors
- Verify Supabase project is active

## Need Help?

See detailed troubleshooting in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

Happy event planning! 📸
