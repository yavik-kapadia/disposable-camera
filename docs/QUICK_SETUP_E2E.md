# 🚀 Quick E2E Setup - 3 Easy Steps

## Prerequisites
✅ **You're already signed in** to your app (you have valid tokens!)  
✅ **Session injection** is configured

## Two Options

### Option A: Use Tokens You Already Have (FASTEST - 2 minutes)

Since you already provided your access token, let's just add the refresh token manually:

#### Step 1: Get Refresh Token (30 seconds)
1. Open your app in Chrome (http://localhost:3000)
2. Press **F12** → **Console** tab
3. Paste:
```javascript
JSON.parse(localStorage.getItem('sb-uhvfrypgsrhgawvedguc-auth-token')).refresh_token
```
4. Copy the token (starts with `v2.public.` or similar)

#### Step 2: Update .env.e2e (30 seconds)
Edit `e2e/.env.e2e` and replace:
```env
E2E_REFRESH_TOKEN='REPLACE_WITH_REFRESH_TOKEN'
```
with your actual token

#### Step 3: Run Setup (1 minute)
```bash
npm run test:e2e:setup
npm run test:e2e
```

**Done!** ✅

---

### Option B: Fully Automated Extraction (4 minutes)

Use the automated script (requires dev server running):

#### Step 1: Start Dev Server
```bash
npm run dev
```

#### Step 2: Sign In
Open http://localhost:3000 in your browser and sign in with Google

#### Step 3: Extract Tokens (in a new terminal)
```bash
npm run extract-tokens
```

#### Step 4: Run Tests
```bash
npm run test:e2e:setup
npm run test:e2e
```

**Done!** ✅

---

## Which Should You Choose?

### Choose Option A if:
- ✅ You want the fastest setup (2 min)
- ✅ You're already signed in
- ✅ You don't mind one copy-paste

### Choose Option B if:
- ✅ You want zero copy-paste
- ✅ Dev server is already running
- ✅ You prefer full automation

## My Recommendation

**Use Option A** - It's faster since you already have the access token. Just need the refresh token!

---

## Troubleshooting

### "Connection refused" error
→ Dev server not running. Start it: `npm run dev`

### "No session found"
→ Not signed in. Go to http://localhost:3000 and sign in with Google

### "Tokens expired"
→ Run `npm run extract-tokens` again to get fresh tokens

---

## What Happens After Setup?

Once tokens are configured:
1. ✅ Session injection setup runs: `npm run test:e2e:setup`
2. ✅ Tokens get injected into browser
3. ✅ All tests run as authenticated user
4. ✅ No Google OAuth blocking!
5. ✅ Tests work for 60 days!

Then you can run tests anytime:
```bash
npm run test:e2e          # All tests
npm run test:e2e:ui       # Interactive
npm run test:e2e:auth     # Only authenticated
```

**No re-authentication needed for 60 days!** 🎉


