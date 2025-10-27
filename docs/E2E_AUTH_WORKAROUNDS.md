# Google OAuth Still Blocking? Alternative Solutions

If Google is still blocking your sign-in attempts, here are your options:

## Option 1: Use Your Regular Chrome Profile (Easiest)

Sign in to Google in your regular Chrome browser first, then use that profile for Playwright:

### Step 1: Find Your Chrome Profile Path

**macOS:**
```bash
~/Library/Application Support/Google/Chrome/Default
```

**Linux:**
```bash
~/.config/google-chrome/Default
```

**Windows:**
```
C:\Users\<username>\AppData\Local\Google\Chrome\User Data\Default
```

### Step 2: Update Playwright Config

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: {
        // Use your real Chrome profile
        channel: 'chrome',
        launchOptions: {
          args: [
            `--user-data-dir=${process.env.HOME}/Library/Application Support/Google/Chrome`,
            '--profile-directory=Default',
          ],
        },
      },
    },
    // ... other projects
  ],
});
```

### Step 3: Sign In Once in Regular Chrome

1. Open Chrome normally
2. Go to `http://localhost:3000` (start your dev server first)
3. Sign in with Google
4. Close Chrome

### Step 4: Run Tests

```bash
npm run test:e2e:setup  # Will use your existing Chrome session
npm run test:e2e        # Tests will work!
```

## Option 2: Enable Email/Password Auth in Supabase (Recommended for CI/CD)

Instead of Google OAuth, use email/password authentication:

### Step 1: Enable in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Email** provider
3. Disable email confirmation for testing (or handle it in tests)

### Step 2: Create Test User

In Supabase SQL Editor:
```sql
-- Create a test user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'test@example.com',
  crypt('test-password-123', gen_salt('bf')),
  NOW()
);
```

### Step 3: Update Your App

Add email/password sign-in option to your login page:

```typescript
// app/page.tsx
const handleEmailSignIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
};
```

### Step 4: Update E2E Tests

```typescript
// e2e/auth.setup.ts
setup('authenticate with email', async ({ page, context }) => {
  await page.goto('/');
  
  // Fill in email/password form
  await page.getByLabel(/email/i).fill('test@example.com');
  await page.getByLabel(/password/i).fill('test-password-123');
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for dashboard
  await page.waitForURL(/.*dashboard/);
  
  // Save session
  await context.storageState({ path: authFile });
});
```

**Benefits:**
- ✅ No Google blocking issues
- ✅ Fully automated
- ✅ Works in CI/CD
- ✅ Fast and reliable

## Option 3: Use Playwright's Authentication Bypass

Skip authentication in E2E tests by injecting session tokens directly:

```typescript
// e2e/auth.setup.ts
import { supabase } from '@/lib/supabase';

setup('inject auth session', async ({ context }) => {
  // Get a valid session from Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'test-password-123',
  });

  if (error || !data.session) {
    throw new Error('Failed to get session');
  }

  // Inject session into browser
  await context.addCookies([
    {
      name: 'sb-access-token',
      value: data.session.access_token,
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'sb-refresh-token',
      value: data.session.refresh_token,
      domain: 'localhost',
      path: '/',
    },
  ]);

  await context.storageState({ path: authFile });
});
```

## Option 4: Use Google's Test Accounts (If Available)

If you're working with Google Workspace or have access to test accounts, use those:

1. Create a Google test account specifically for automation
2. Disable 2FA for the test account
3. Add the account to your Google Cloud Project's test users
4. Use those credentials

## Option 5: Manual Sign-In Per Session (Simple but Manual)

If you rarely run E2E tests, just sign in manually each time:

```bash
# Run tests with headed browser
npx playwright test --headed

# Sign in manually when the browser opens
# Browser will stay open during tests
```

## Recommended Approach for Your Project

For **disposable-camera**, I recommend **Option 2 (Email/Password Auth)**:

### Why?

1. ✅ **Fully automated** - no manual steps
2. ✅ **CI/CD ready** - works in GitHub Actions
3. ✅ **No Google issues** - bypasses OAuth entirely
4. ✅ **Fast** - no OAuth redirects
5. ✅ **Reliable** - no blocking or captchas

### Quick Implementation

1. **Enable email auth in Supabase**
2. **Add email sign-in form** to your login page (can coexist with Google OAuth)
3. **Create test user** in Supabase
4. **Update auth.setup.ts** to use email/password
5. **Keep Google OAuth** for real users

This way:
- Real users can still use Google OAuth
- E2E tests use email/password (automated)
- Best of both worlds!

## Need Help?

Try these in order:

1. ✅ **Option 2** (Email/Password) - Recommended
2. ✅ **Option 1** (Chrome Profile) - Quick fix
3. ✅ **Option 3** (Session Injection) - Advanced
4. ✅ **Option 5** (Manual) - Fallback

---

**Current Status**: The updated `auth.setup.ts` now uses stealth mode to reduce detection, but Google's blocking is unpredictable. Email/password auth is the most reliable solution for E2E tests.


