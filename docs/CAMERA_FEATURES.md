# Camera Features Guide

The camera component now includes professional-grade features while maintaining the simplicity of a disposable camera experience.

## 🎯 Core Features

### 📸 Photo Counter
- **Location**: Top-left corner of camera view
- **Purpose**: Track how many photos you've taken in this session
- **Resets**: When you reload the page or restart the camera

### 🎨 Filters
Real-time filters applied to both the live preview and captured photos:

- **None** - Natural, unfiltered photos
- **Black & White** - Classic monochrome aesthetic
- **Sepia** - Vintage warm brown tone
- **Vintage** - Retro color grading with reduced saturation

**How to use**: Select from the filter dropdown before taking photos. The effect is visible in real-time on the viewfinder.

### 📐 Grid Overlay
- **Purpose**: Rule of thirds composition guide
- **Benefits**: Better photo composition and framing
- **Toggle**: Click the "Grid" button to show/hide
- **Visual**: Semi-transparent white lines dividing the frame into 9 equal sections

### ⏱️ Self-Timer
Perfect for group photos or selfies:
- **3 seconds** - Quick timer
- **5 seconds** - Standard timer
- **10 seconds** - Long timer for complex setups

**How it works**:
1. Select timer duration from dropdown
2. Press capture button
3. Large countdown appears on screen
4. Photo captures automatically when timer reaches zero

### 👁️ Quick Preview
After each photo:
- **Duration**: 2 seconds
- **Shows**: Full-screen preview of captured photo
- **Confirmation**: Green checkmark badge
- **Non-blocking**: Photo uploads in background while you can take more

### 🔄 Camera Switching
- **Toggle**: Between front and rear cameras
- **Location**: Bottom-left corner
- **Icon**: Circular arrow
- **Use case**: Switch from selfie to environment mode

### ⚡ Background Uploads
- **Non-blocking**: Take photos rapidly without waiting
- **Queue indicator**: Shows how many photos are uploading
- **Smart**: Compresses images and generates thumbnails automatically
- **Notifications**: Toast messages for errors (no intrusive alerts)

## 💡 Usage Tips

### For Best Composition
1. Enable the **Grid** overlay
2. Position subjects at intersection points (rule of thirds)
3. Align horizons with horizontal grid lines

### For Group Photos
1. Set **Timer** to 5s or 10s
2. Position camera on stable surface
3. Get in position before countdown ends

### For Artistic Shots
1. Try different **Filters** to preview effects live
2. **Black & White** works great for portraits
3. **Vintage** adds a disposable camera aesthetic
4. **Sepia** creates nostalgic mood

### For Rapid-Fire Photography
1. Keep all settings on defaults (no timer)
2. Take photos quickly - they upload in background
3. Watch the **Upload Queue** indicator to see progress
4. Photo counter shows your session total

## 🎨 Filter Technical Details

### Black & White
- **Algorithm**: Luminosity-weighted grayscale
- **Formula**: `0.299R + 0.587G + 0.114B`
- **Result**: Natural-looking monochrome

### Sepia
- **Effect**: Warm brown tones
- **RGB Transform**: Standard sepia matrix
- **Mood**: Vintage, nostalgic

### Vintage
- **Effect**: Slight red boost, reduced blue
- **Color shift**: -10° hue rotation
- **Saturation**: 80% of original
- **Result**: Authentic film camera look

## 📱 Mobile Optimizations

All features work seamlessly on mobile devices:
- Touch-friendly controls
- Responsive layout
- Optimized for portrait and landscape
- Native camera access
- Efficient image compression

## 🔐 Privacy & Performance

- **No tracking**: Photos count resets per session
- **Client-side processing**: Filters applied in your browser
- **Efficient uploads**: Compression + WebP thumbnails
- **Background processing**: Non-blocking uploads
- **Secure**: Only event creator sees photos

## 🚀 Quick Start

1. **Start Camera** → Click "Start Camera" button
2. **Configure** → Choose filter, enable grid, set timer (optional)
3. **Compose** → Frame your shot using the grid
4. **Capture** → Press the white circle button
5. **Preview** → See your photo briefly, then continue shooting
6. **Monitor** → Check upload queue and photo count

Enjoy your enhanced disposable camera experience! 📸

