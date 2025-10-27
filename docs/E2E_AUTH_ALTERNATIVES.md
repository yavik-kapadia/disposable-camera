# E2E Authentication - Google OAuth Challenges

## The Problem

Google has strong security measures that **detect and block automated browser logins** (like Playwright). When you try to automate Google sign-in, you'll often see:

- `/signin/rejected` URL
- "This browser or app may not be secure" message
- Captcha challenges
- Account locked warnings

## Solutions

### Option 1: Manual Authentication Once (Recommended)

Instead of automating the Google login, authenticate manually once and save the session.

**Steps**:

```bash
# Run auth setup in headed mode (you'll see the browser)
npm run test:e2e:setup
```

**What happens**:
1. Browser opens
2. Clicks "Sign in with Google"
3. **YOU manually sign in** (handle captcha, 2FA, etc.)
4. Session is saved to `playwright/.auth/user.json`
5. All future tests reuse this session (no re-login needed!)

**Update `auth.setup.ts`**:

```typescript
setup('authenticate with Google - MANUAL', async ({ page, context }) => {
  console.log('🔐 Starting MANUAL authentication flow...');
  console.log('📝 Please sign in manually when the browser opens');

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Click sign in button
  const signInButton = page.getByRole('button', { name: /sign in with google/i });
  await signInButton.click();

  console.log('⏳ Waiting for you to complete Google sign-in...');
  console.log('   1. Complete the Google login');
  console.log('   2. Solve any captchas');
  console.log('   3. Complete 2FA if prompted');
  console.log('   4. Wait for redirect to dashboard');

  // Wait for redirect to dashboard (with long timeout for manual login)
  await page.waitForURL(/.*dashboard/, { timeout: 300000 }); // 5 minutes
  
  console.log('✅ Authentication successful!');
  
  // Save authenticated state
  await context.storageState({ path: authFile });
  console.log('💾 Saved session - future tests will reuse this!');
});
```

### Option 2: Use Supabase Email/Password Auth

If you enable email/password authentication in Supabase (in addition to Google), you can test with that instead:

1. **Enable Email Auth** in Supabase Dashboard
2. **Create a test user** manually
3. **Update tests** to use email/password login

```typescript
// Instead of Google OAuth
await page.getByLabel(/email/i).fill(testEmail);
await page.getByLabel(/password/i).fill(testPassword);
await page.getByRole('button', { name: /sign in/i }).click();
```

### Option 3: Mock Authentication (Unit Tests Only)

For testing without real auth, mock the Supabase client:

```typescript
// In test setup
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => ({ data: { session: mockSession } }),
      // ...
    }
  }
}));
```

**Limitations**: Only works for unit tests, not E2E tests.

### Option 4: Use Persistent Browser Context

Launch browser with user data to reuse existing Google session:

```typescript
// playwright.config.ts
const browser = await chromium.launchPersistentContext('/path/to/user/data', {
  headless: false,
  channel: 'chrome',
});
```

Sign in once manually, then all tests reuse that browser profile.

## Recommended Approach

**For this project, use Option 1** (Manual Authentication Once):

### Updated Setup Instructions

1. **Run the auth setup** in visible mode:
```bash
npm run test:e2e:setup
```

2. **Manually complete the login**:
   - Browser will open
   - Click "Sign in with Google" automatically
   - **YOU** complete the Google login
   - Solve any captchas
   - Complete 2FA if needed
   - Wait until you see the dashboard

3. **Session is saved** automatically
   - Saved to `playwright/.auth/user.json`
   - Lasts for weeks/months
   - Reused by all tests

4. **Run your tests**:
```bash
npm run test:e2e  # All tests now use saved session!
```

### When Does Session Expire?

- **Supabase sessions** last 1 hour by default
- **Refresh tokens** last 60 days
- **Browser storage** persists until you delete it

**If session expires**: Just re-run `npm run test:e2e:setup` and sign in again manually.

## Why This Works Better

| Approach | Pros | Cons |
|----------|------|------|
| **Automated Google Login** | ❌ Doesn't work | Google blocks it |
| **Manual Login Once** | ✅ Works perfectly<br>✅ Handles all security<br>✅ Session lasts long | Requires manual action once |
| **Email/Password** | ✅ Fully automated<br>✅ No Google issues | Requires Supabase config |
| **Mocked Auth** | ✅ Fast, isolated | Only for unit tests |

## Implementation

I'll update the auth setup to use the manual approach:

```bash
# You'll run this ONCE
npm run test:e2e:setup

# Then run tests normally (reuses session)
npm run test:e2e
npm run test:e2e:ui
```

The manual login only needs to be done:
- Once initially
- When session expires (every ~60 days)
- When you delete the session file

---

**This is the industry-standard approach for E2E testing with Google OAuth!** Companies like Google, Airbnb, and Stripe all use manual authentication for E2E tests because automating OAuth providers is unreliable.


