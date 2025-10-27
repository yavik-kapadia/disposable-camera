# Event-Specific PWA Setup Guide

Each event now gets its own installable Progressive Web App with custom branding!

## 🎯 **How It Works:**

### **Dynamic PWA Generation**
When users visit an event camera page (`/camera/[CODE]`), the system automatically:
1. Fetches event details from the database
2. Generates a custom PWA manifest with the event name
3. Offers an "Install App" prompt
4. Creates a home screen icon with the event name

## 📱 **User Flow:**

### **Step 1: Share Event Link**
Event creator shares: `https://your-domain.com/camera/ABC123`

### **Step 2: User Opens Link**
Guest opens the link in their mobile browser

### **Step 3: Install Prompt Appears**
Beautiful orange banner shows:
```
📱 Install [Event Name]
Add this camera to your home screen for quick access. Works offline!
[Install App] [Maybe Later]
```

### **Step 4: App Installed**
- Icon appears on home screen with event name
- Tapping launches directly to the camera
- Works offline
- No browser UI - pure app experience

## 🔧 **Technical Implementation:**

### **Dynamic Manifest Route**
`/app/camera/[code]/manifest.json/route.ts`

Generates per-event manifests:
```json
{
  "name": "Birthday Party - Camera",
  "short_name": "Birthday Party",
  "description": "Take photos for Birthday Party",
  "start_url": "/camera/ABC123",
  "scope": "/camera/ABC123",
  ...
}
```

### **Install Prompt Logic**
- Listens for `beforeinstallprompt` event
- Shows custom UI when available
- Uses native install dialog
- Tracks installation state

## 🎨 **Features:**

### ✅ **Per-Event Customization:**
- Custom app name: "[Event Name] - Camera"
- Event-specific description
- Direct link to event camera
- Scoped to event URL

### ✅ **Smart Install Flow:**
- Only shows on supported browsers (Chrome, Edge, Samsung Internet)
- iOS users see "Add to Home Screen" instructions instead
- Can dismiss and see again later
- Remembers if already installed

### ✅ **Offline Support:**
- Service worker caches assets
- Camera works without internet
- Uploads queued when back online

## 📊 **Browser Support:**

| Browser | Install Prompt | Home Screen | Offline |
|---------|---------------|-------------|---------|
| Chrome (Android) | ✅ Auto | ✅ | ✅ |
| Samsung Internet | ✅ Auto | ✅ | ✅ |
| Edge (Android) | ✅ Auto | ✅ | ✅ |
| Safari (iOS) | Manual* | ✅ | ✅ |
| Firefox | Manual* | ✅ | ✅ |

*Manual: Users tap Share → Add to Home Screen

## 🎯 **Use Cases:**

### **Wedding Photography**
- Bride shares camera link with guests
- Guests install "Sarah & John's Wedding - Camera"
- Everyone has instant camera access
- Photos upload to event organizer

### **Birthday Party**
- Host shares link
- Kids install "Emma's Birthday - Camera" 
- Take photos throughout party
- All photos collected in one place

### **Corporate Event**
- Company shares event camera
- Attendees install "Tech Summit 2024 - Camera"
- Professional event photography
- Organized photo collection

## 🚀 **Advantages Over Generic PWA:**

### **Before (Generic PWA):**
- ❌ One "Disposable Camera" app for all events
- ❌ User must navigate to find their event
- ❌ Confusing if attending multiple events
- ❌ Generic branding

### **After (Event-Specific PWA):**
- ✅ Unique app per event
- ✅ Direct launch to event camera
- ✅ Clear app name on home screen
- ✅ Event-specific branding
- ✅ Multiple events = multiple apps (no confusion)

## 💡 **Implementation Details:**

### **Manifest Generation**
```typescript
// Dynamic route: /camera/[code]/manifest.json
const manifest = {
  name: `${event.name} - Camera`,
  short_name: event.name,
  description: event.description || `Take photos for ${event.name}`,
  start_url: `/camera/${code}`,
  scope: `/camera/${code}`,
  // ... icons, theme, etc
};
```

### **Install Prompt**
```typescript
// Listen for browser install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  setDeferredPrompt(e);
  setShowInstallPrompt(true);
});

// Show custom UI
<button onClick={() => deferredPrompt.prompt()}>
  Install App
</button>
```

## 🎨 **Install Prompt UI:**

```
┌─────────────────────────────────────────┐
│ 📱  Install [Event Name]                │
│                                         │
│ Add this camera to your home screen     │
│ for quick access. Works offline!        │
│                                         │
│ [Install App]  [Maybe Later]            │
└─────────────────────────────────────────┘
```

- Orange gradient background
- Event name in title
- Clear call-to-action
- Dismissible (can show again)

## 📝 **Event Creator Workflow:**

1. **Create Event** in dashboard
2. **Get Access Code** (e.g., ABC123)
3. **Share Link**: `https://your-domain.com/camera/ABC123`
4. **Guests Visit** → See install prompt
5. **Guests Install** → Get event-specific app
6. **Guests Take Photos** → Upload to event

## 🔐 **Security & Privacy:**

- Event must be active to generate manifest
- Only valid events get PWA manifests
- Photos still require authentication to view
- Guests can upload, only creator can view

## 🎉 **Result:**

Each event gets its own **installable app** with:
- ✅ Custom name and branding
- ✅ Direct camera access
- ✅ Offline capability
- ✅ Native app experience
- ✅ No App Store required!

Perfect for disposable camera use cases! 📸

