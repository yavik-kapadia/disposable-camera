# Local Development Guide

This guide covers different ways to run the app locally, including options for testing camera functionality on mobile devices.

## Quick Start

```bash
npm run dev
```

App runs at `http://localhost:3000`

## Testing on Mobile Devices

The camera feature requires either HTTPS or localhost. Since mobile devices can't access "localhost", here are your options:

### Option 1: Use Local Network IP (No Camera)

**Pros**: Simple, works immediately
**Cons**: Camera won't work (HTTP only)

1. Find your computer's local IP address:

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

Example output: `192.168.1.100`

2. Update `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://192.168.1.100:3000
```

3. Restart the dev server:
```bash
npm run dev
```

4. On your mobile device (connected to same WiFi):
   - Open browser
   - Visit `http://192.168.1.100:3000`
   - **Note**: Camera won't work (HTTP), but Upload tab will work

### Option 2: Custom Local HTTPS Domain (Recommended)

**Pros**: Camera works, real HTTPS environment
**Cons**: Requires some setup

This is what you want for `https://cam.local.yavik.dev`

#### Step 1: Set Up Local HTTPS

You have several options:

##### A. Using Caddy (Easiest)

1. Install Caddy:
```bash
# macOS
brew install caddy

# Linux
sudo apt install caddy

# Windows
choco install caddy
```

2. Create `Caddyfile` in project root:
```
cam.local.yavik.dev {
    reverse_proxy localhost:3000
    tls internal
}
```

3. Start Caddy:
```bash
sudo caddy run
```

4. Update `.env.local`:
```env
NEXT_PUBLIC_APP_URL=https://cam.local.yavik.dev
```

5. Start Next.js:
```bash
npm run dev
```

##### B. Using ngrok (Cloud Tunnel)

1. Install ngrok: [ngrok.com/download](https://ngrok.com/download)

2. Start Next.js:
```bash
npm run dev
```

3. In another terminal, start ngrok:
```bash
ngrok http 3000
```

4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

5. Update `.env.local`:
```env
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

6. Restart dev server

##### C. Using mkcert (Self-Signed Certificate)

1. Install mkcert:
```bash
# macOS
brew install mkcert nss

# Linux
sudo apt install libnss3-tools
brew install mkcert

# Windows
choco install mkcert
```

2. Create local CA:
```bash
mkcert -install
```

3. Generate certificate:
```bash
mkcert localhost 192.168.1.100 cam.local.yavik.dev
```

4. Configure Next.js with HTTPS (create `server.js`):
```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('./localhost+2-key.pem'),
  cert: fs.readFileSync('./localhost+2.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
  });
});
```

5. Update `package.json`:
```json
{
  "scripts": {
    "dev": "node server.js",
    "dev:http": "next dev"
  }
}
```

6. Update `.env.local`:
```env
NEXT_PUBLIC_APP_URL=https://cam.local.yavik.dev
```

#### Step 2: Set Up Custom Domain DNS

##### For `cam.local.yavik.dev`

**Option A: Local DNS (Easiest)**

Edit your hosts file:

```bash
# macOS/Linux
sudo nano /etc/hosts

# Windows (Run as Administrator)
notepad C:\Windows\System32\drivers\etc\hosts
```

Add this line (replace with your actual IP):
```
192.168.1.100  cam.local.yavik.dev
```

**Option B: Router DNS**

If you have access to your router:
1. Log into your router admin panel
2. Find DNS or Hosts settings
3. Add entry: `cam.local.yavik.dev` → `192.168.1.100`

**Option C: Real DNS (If you own yavik.dev)**

1. Add an A record in your DNS provider:
   - Type: `A`
   - Name: `cam.local` or `*.local`
   - Value: Your public IP or server IP
   - TTL: 300

2. For local testing, use split-horizon DNS or local override

#### Step 3: Test

1. Visit `https://cam.local.yavik.dev`
2. Accept certificate warning (if using self-signed)
3. Camera should work!
4. Test on mobile devices on same network

### Option 3: Deploy to Vercel Preview

**Pros**: Real HTTPS, shareable URL
**Cons**: Requires git push for every change

1. Push code to GitHub
2. Connect to Vercel
3. Every push creates a preview deployment
4. Use preview URL for testing

## Get Your Local IP Address Script

Create a script to easily find your IP:

**get-ip.sh** (macOS/Linux):
```bash
#!/bin/bash
echo "Your local IP addresses:"
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
```

**get-ip.bat** (Windows):
```batch
@echo off
echo Your local IP addresses:
ipconfig | findstr IPv4
```

Make it executable:
```bash
chmod +x get-ip.sh
./get-ip.sh
```

## Quick Commands

```bash
# Get your IP (macOS/Linux)
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'

# Get your IP (Windows)
ipconfig | findstr IPv4

# Test local domain resolution
ping cam.local.yavik.dev

# Check if port 3000 is in use
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -t -i:3000)
```

## Recommended Setup for Development

### For Solo Development
- Use `http://localhost:3000`
- Use Upload tab for testing uploads
- Deploy to Vercel for camera testing

### For Team/Mobile Testing
- Use **ngrok** (fastest setup)
- Or use **Caddy** with custom domain (most professional)

### For Production-Like Testing
- Use **Caddy** with mkcert
- Or deploy preview on Vercel

## Environment Variables Cheat Sheet

```env
# Local development (no camera)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Local network (no camera, but can test on mobile)
NEXT_PUBLIC_APP_URL=http://192.168.1.100:3000

# ngrok tunnel (camera works)
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# Custom local domain with HTTPS (camera works)
NEXT_PUBLIC_APP_URL=https://cam.local.yavik.dev

# Production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Testing Camera on Different Browsers

### Desktop (HTTPS required in production)
- ✅ Chrome (localhost or HTTPS)
- ✅ Firefox (localhost or HTTPS)
- ✅ Safari (localhost or HTTPS)
- ✅ Edge (localhost or HTTPS)

### Mobile (HTTPS required)
- ✅ Safari iOS 14.3+ (HTTPS only)
- ✅ Chrome Android (HTTPS only)
- ❌ Chrome iOS (uses Safari engine)

### Testing Matrix

| Environment | Camera Works | Upload Works |
|-------------|--------------|--------------|
| localhost | ✅ | ✅ |
| Local IP (HTTP) | ❌ | ✅ |
| ngrok (HTTPS) | ✅ | ✅ |
| Custom HTTPS | ✅ | ✅ |
| Production (HTTPS) | ✅ | ✅ |

## Troubleshooting

### "Camera API not available"
- Check that you're using HTTPS (or localhost)
- Verify browser supports getUserMedia
- Use Upload tab as fallback

### "DNS_PROBE_FINISHED_NXDOMAIN"
- Check hosts file entry is correct
- Flush DNS: `sudo dscacheutil -flushcache` (macOS)
- Restart browser

### "NET::ERR_CERT_AUTHORITY_INVALID"
- Expected with self-signed certs
- Click "Advanced" → "Proceed anyway"
- Or install mkcert CA on device

### Can't Access from Mobile
- Ensure both devices on same WiFi
- Check firewall isn't blocking port 3000
- Verify IP address is correct
- Try disabling VPN

### Port Already in Use
```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

## Recommended: Quick HTTPS Setup with Caddy

This is the easiest way to get `https://cam.local.yavik.dev` working:

```bash
# 1. Install Caddy
brew install caddy

# 2. Create Caddyfile
cat > Caddyfile << 'EOF'
cam.local.yavik.dev {
    reverse_proxy localhost:3000
    tls internal
}
EOF

# 3. Add to /etc/hosts
echo "127.0.0.1  cam.local.yavik.dev" | sudo tee -a /etc/hosts

# 4. Update .env.local
echo "NEXT_PUBLIC_APP_URL=https://cam.local.yavik.dev" > .env.local

# 5. Start both servers
# Terminal 1:
npm run dev

# Terminal 2:
sudo caddy run

# 6. Visit https://cam.local.yavik.dev
```

Done! Camera will work perfectly. 📸

## Accessing from Other Devices (with Caddy)

To access from mobile devices on your network:

1. Get your local IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. Update Caddyfile:
```
cam.local.yavik.dev, 192.168.1.100 {
    reverse_proxy localhost:3000
    tls internal
}
```
3. On mobile device, add exception for self-signed cert
4. Visit `https://192.168.1.100` or `https://cam.local.yavik.dev`

---

Need more help? Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
