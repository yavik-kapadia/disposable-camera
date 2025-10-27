# 🚀 E2E Tests with Chrome Profile

## Overview

Our E2E tests use your **actual Chrome profile** for authentication. No token extraction, no complex setup - just use your existing signed-in Chrome session!

## How It Works

1. **Playwright connects to your Chrome profile** - Uses `--user-data-dir` to access your Chrome profile
2. **Tests run with your session** - Already signed in, no authentication needed
3. **Works immediately** - As long as you're signed in to Chrome, tests work

## Prerequisites

✅ **Google Chrome installed** (not just Chromium)  
✅ **Signed in** to http://localhost:3000 in Chrome  
✅ **All Chrome windows closed** when running tests (important!)

## Setup (One-Time)

### Step 1: Sign In to Chrome
```bash
# Start dev server
npm run dev

# Open Chrome and sign in
open http://localhost:3000
```

Sign in with Google and make sure you can access your dashboard.

### Step 2: Close All Chrome Windows

**Important:** Playwright needs exclusive access to your Chrome profile.

### Step 3: Run Tests
```bash
npm run test:e2e
```

That's it! 🎉

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Authenticated Tests Only
```bash
npm run test:e2e:auth
```

### Public Tests Only (no auth needed)
```bash
npm run test:e2e:public
```

### Interactive UI Mode
```bash
npm run test:e2e:ui
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Headed Mode (see browser)
```bash
npm run test:e2e:headed
```

## Project Structure

### `chromium-authenticated`
- Uses your Chrome profile
- Runs all authenticated tests
- Skips public-only tests

### `chromium-public`
- Uses clean browser (no profile)
- Runs only public pages (home, FAQ)
- No authentication

## Benefits

✅ **Zero setup** - No tokens, no extraction, no manual steps  
✅ **Always works** - Uses your real Chrome session  
✅ **No expiration** - Session stays valid as long as you're signed in  
✅ **Realistic testing** - Tests exactly like a real user  
✅ **Fast** - No authentication delays

## Troubleshooting

### "Chrome is already running"
**Solution:** Close all Chrome windows before running tests.

```bash
# macOS: Kill all Chrome processes
pkill -f "Google Chrome"

# Then run tests
npm run test:e2e
```

### "Not signed in" errors
**Solution:** Sign in to Chrome first.

```bash
# Start dev server
npm run dev

# Open Chrome (not during test) and sign in
open http://localhost:3000

# Sign in with Google
# Close Chrome
# Run tests
npm run test:e2e
```

### Tests fail with session errors
**Solution:** Your Chrome session might have expired.

1. Open Chrome normally (outside tests)
2. Go to http://localhost:3000
3. Sign in again if needed
4. Close Chrome
5. Run tests again

### "Profile in use" error
**Solution:** Make sure all Chrome windows are closed.

```bash
# Force quit Chrome
pkill -9 "Google Chrome"

# Wait a moment
sleep 2

# Run tests
npm run test:e2e
```

## CI/CD Considerations

For CI environments, you'll need a different approach since CI doesn't have your Chrome profile.

Options for CI:
1. **Session injection** - Use service account tokens
2. **Magic Link** - Programmatic magic link generation
3. **Admin API** - Create test sessions via Supabase Admin API

See `E2E_AUTH_ALTERNATIVES.md` for CI setup.

## Security Notes

✅ **Local only** - This approach is for local development only  
✅ **No tokens in repo** - No .env files with credentials  
✅ **Uses real auth** - Tests actual OAuth flow  
⚠️ **Don't use in CI** - Use dedicated test accounts for CI

## Why This Is Better

### Before (Token Extraction)
1. ❌ Extract tokens from browser
2. ❌ Save to `.env.e2e`
3. ❌ Run setup script to inject tokens
4. ❌ Tokens expire after 1 hour
5. ❌ Repeat process when expired

### Now (Chrome Profile)
1. ✅ Sign in to Chrome once
2. ✅ Run tests
3. ✅ Session stays valid for 60 days
4. ✅ No setup scripts needed

## Example Test Run

```bash
$ npm run test:e2e

🎭 Playwright E2E Tests
✅ Using your Chrome profile for authentication
✅ Make sure you're signed in to http://localhost:3000 in Chrome

Running 24 tests using 1 worker

  ✓ home.spec.ts:3:5 › Home page loads successfully (1.2s)
  ✓ dashboard-authenticated.spec.ts:5:5 › Dashboard shows user events (2.1s)
  ✓ event-workflow.spec.ts:7:5 › Can create and view event (3.4s)
  
24 passed (28.3s)
```

## Summary

**That's it!** Your E2E tests now use your real Chrome profile. No tokens, no extraction, no complex setup. Just sign in once and run tests forever! 🚀

