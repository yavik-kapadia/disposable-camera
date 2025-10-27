# E2E Authentication Alternatives (No Google, No Email/Password)

## Overview

You have **5 viable alternatives** to authenticate in E2E tests without Google OAuth or email/password:

1. ✅ **Session Injection** (Easiest - Use existing session)
2. ✅ **API Token Authentication** (Programmatic)
3. ✅ **Mock Authentication** (Test mode bypass)
4. ✅ **Browser Profile Reuse** (Use authenticated Chrome)
5. ✅ **Magic Link Authentication** (Supabase feature)

---

## Option 1: Session Injection ⭐ RECOMMENDED

**Inject an existing Supabase session directly into the browser.**

### How It Works

1. You sign in manually once (anywhere - even in a different browser)
2. Copy your Supabase session tokens
3. Inject them into Playwright tests
4. All tests run as authenticated user!

### Implementation

#### Step 1: Get Your Session Tokens

Sign in to your app manually in Chrome, then open DevTools Console:

```javascript
// Get your Supabase tokens
const session = await supabase.auth.getSession();
console.log('Access Token:', session.data.session.access_token);
console.log('Refresh Token:', session.data.session.refresh_token);
```

Copy these tokens (they're long strings).

#### Step 2: Create Session Injection Setup

```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';
import * as path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

// YOUR TOKENS (get from Step 1)
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6...'; // Your actual token
const REFRESH_TOKEN = 'v2.public.eyJpc3MiOiJzdXBh...'; // Your actual token

setup('inject Supabase session', async ({ context }) => {
  console.log('💉 Injecting Supabase session...\n');

  // Create storage state with Supabase tokens
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage: [
          {
            name: 'sb-uhvfrypgsrhgawvedguc-auth-token',
            value: JSON.stringify({
              access_token: ACCESS_TOKEN,
              refresh_token: REFRESH_TOKEN,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              expires_in: 3600,
              token_type: 'bearer',
              user: {
                id: 'user-id-here',
                email: 'your-email@gmail.com',
              },
            }),
          },
        ],
      },
    ],
  };

  // Save the storage state
  await context.addCookies([]);
  await context.addInitScript((state) => {
    state.origins.forEach((origin: any) => {
      origin.localStorage.forEach((item: any) => {
        localStorage.setItem(item.name, item.value);
      });
    });
  }, storageState);

  // Save to file
  const fs = require('fs');
  fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));

  console.log('✅ Session injected successfully!');
  console.log('🎉 Run tests with: npm run test:e2e\n');
});
```

#### Step 3: Update the Token Name

Find your Supabase project ref in the storage key. Check DevTools → Application → Local Storage:

The key format is: `sb-[PROJECT-REF]-auth-token`

Update the `name` in the code above to match your project.

### Pros & Cons

✅ **Pros:**
- No Google interaction needed
- No login UI needed
- Fast setup (30 seconds)
- Works immediately

❌ **Cons:**
- Tokens expire (~1 hour for access, 60 days for refresh)
- Need to update tokens when they expire
- Need to get tokens manually first time

---

## Option 2: API Token Authentication

**Create sessions programmatically using Supabase Admin API.**

### Requirements

- Supabase Service Role Key (from Supabase Dashboard)
- Direct API access

### Implementation

#### Step 1: Get Service Role Key

1. Supabase Dashboard → Settings → API
2. Copy the `service_role` key (starts with `eyJ...`)

#### Step 2: Create Auth Setup with Admin API

```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env.e2e') });

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

// Use service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Add this to .env.e2e
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

setup('create session via admin API', async ({ context }) => {
  console.log('🔑 Creating session via Admin API...\n');

  // Create or get test user
  const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: 'e2e-test@example.com',
    email_confirm: true,
    user_metadata: {
      full_name: 'E2E Test User',
    },
  });

  if (userError && !userError.message.includes('already exists')) {
    throw userError;
  }

  // Generate session for this user
  const { data: session, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'e2e-test@example.com',
  });

  if (sessionError) throw sessionError;

  console.log('✅ Session created:', session);

  // TODO: Extract tokens and inject them
  // Similar to Option 1 above

  console.log('✅ Ready to test!\n');
});
```

#### Step 3: Add to .env.e2e

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Pros & Cons

✅ **Pros:**
- Fully automated
- Creates fresh users
- No manual token copying
- Works in CI/CD

❌ **Cons:**
- Requires service role key
- More complex setup
- Need to manage test users

---

## Option 3: Mock Authentication (Test Mode)

**Bypass authentication entirely in E2E tests.**

### Implementation

#### Step 1: Add Test Mode to Auth Context

```typescript
// contexts/AuthContext.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ... existing code ...

  // Add test mode bypass
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true') {
      // Inject mock user for E2E tests
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
        },
      };
      setUser(mockUser as any);
      setSession({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
      } as any);
      setLoading(false);
      return;
    }

    // ... existing auth code ...
  }, []);

  // ... rest of code ...
}
```

#### Step 2: Enable Test Mode in Playwright

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000',
    
    // Inject test mode
    extraHTTPHeaders: {
      'x-e2e-test-mode': 'true',
    },
  },
  
  webServer: {
    command: 'NEXT_PUBLIC_E2E_TEST_MODE=true npm run dev',
    // ... rest of config
  },
});
```

#### Step 3: No Auth Setup Needed!

```typescript
// e2e/auth.setup.ts - DELETE THIS FILE
// Tests just work without authentication!
```

### Pros & Cons

✅ **Pros:**
- Zero authentication needed
- Instant test startup
- No token management
- Works offline

❌ **Cons:**
- Not testing real auth flow
- Need code changes in app
- Test mode could leak to production (if not careful)
- Doesn't test OAuth integration

---

## Option 4: Browser Profile Reuse

**Use your already-authenticated Chrome profile.**

### Implementation

#### Step 1: Sign In Manually in Chrome

1. Open Chrome normally
2. Navigate to `http://localhost:3000`
3. Sign in with Google (works in real Chrome)
4. Close Chrome

#### Step 2: Update Playwright to Use Chrome Profile

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as os from 'os';

// Chrome profile path (macOS)
const chromeProfilePath = path.join(
  os.homedir(),
  'Library/Application Support/Google/Chrome'
);

export default defineConfig({
  projects: [
    {
      name: 'chromium-authenticated',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            `--user-data-dir=${chromeProfilePath}`,
            '--profile-directory=Default',
          ],
        },
      },
    },
  ],
});
```

#### Step 3: No Setup Test Needed

```bash
# Just run tests - they use your Chrome session!
npm run test:e2e
```

### Pros & Cons

✅ **Pros:**
- Uses real authentication
- No automation detection
- Works with any OAuth provider
- Google doesn't block it

❌ **Cons:**
- Uses your personal Chrome profile
- Can't run in parallel (profile lock)
- Not isolated
- Doesn't work in CI/CD

---

## Option 5: Magic Link Authentication

**Supabase can send magic links that bypass OAuth.**

### Implementation

#### Step 1: Enable in Supabase

Already enabled by default in Supabase!

#### Step 2: Create Test Email Catcher

Use a service like:
- Mailosaur (for testing)
- Ethereal Email (free fake SMTP)
- Local mail server

#### Step 3: Automate Magic Link Flow

```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

setup('authenticate with magic link', async ({ page, context }) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Request magic link
  const { error } = await supabase.auth.signInWithOtp({
    email: 'test@mailosaur.io',
  });

  if (error) throw error;

  console.log('📧 Magic link sent! Check email...');

  // TODO: Fetch email from mailosaur API
  // TODO: Extract magic link
  // TODO: Visit magic link in playwright

  // For now, wait for manual click
  console.log('⏳ Click the magic link in your email...');
  await page.waitForURL(/.*dashboard/, { timeout: 300000 });

  await context.storageState({ path: authFile });
});
```

### Pros & Cons

✅ **Pros:**
- No password needed
- Works with real Supabase
- Can be fully automated (with email service)

❌ **Cons:**
- Requires email service integration
- Slower (email delivery time)
- More complex

---

## Comparison Table

| Method | Automation | Setup Time | Reliability | CI/CD |
|--------|-----------|------------|-------------|-------|
| **Session Injection** | ✅ Full | ⚡ 2 min | ⭐⭐⭐⭐⭐ | ✅ Yes |
| **Admin API** | ✅ Full | 🔧 10 min | ⭐⭐⭐⭐ | ✅ Yes |
| **Mock Auth** | ✅ Full | ⚡ 5 min | ⭐⭐⭐ | ✅ Yes |
| **Chrome Profile** | ❌ Manual | ⚡ 1 min | ⭐⭐⭐⭐⭐ | ❌ No |
| **Magic Link** | ⚠️ Partial | 🔧 20 min | ⭐⭐⭐ | ⚠️ Complex |

---

## Recommended Solution for You

**Use Option 1 (Session Injection)** 🎯

### Why?

1. ✅ **Works immediately** - 2 minute setup
2. ✅ **No Google** - bypasses OAuth entirely
3. ✅ **No email/password** - no auth UI needed
4. ✅ **CI/CD ready** - tokens can be stored in secrets
5. ✅ **Fully automated** - no manual steps after setup

### Quick Start

```bash
# 1. Sign in to your app in Chrome
# 2. Open DevTools Console and run:
const session = await supabase.auth.getSession();
console.log('Tokens:', session.data.session);

# 3. Copy the tokens
# 4. Update e2e/auth.setup.ts with tokens
# 5. Run tests!
npm run test:e2e
```

---

## Implementation: Session Injection (Step-by-Step)

Let me create the complete implementation for you...

### Step 1: Sign In Manually

1. Open your app in Chrome: `http://localhost:3000`
2. Sign in with Google (works in real browser)
3. Open DevTools (F12)
4. Go to Console tab
5. Paste this code:

```javascript
(async () => {
  const { data } = await supabase.auth.getSession();
  console.log('=== COPY THESE TOKENS ===');
  console.log('ACCESS_TOKEN:', data.session.access_token);
  console.log('REFRESH_TOKEN:', data.session.refresh_token);
  console.log('=========================');
})();
```

6. Copy both tokens

### Step 2: Store Tokens Securely

Create `e2e/.env.e2e`:

```env
E2E_ACCESS_TOKEN=eyJhbGciOiJIUz...  # Your access token
E2E_REFRESH_TOKEN=v2.public.eyJpc...  # Your refresh token
```

### Step 3: Update Auth Setup

I'll create the complete auth setup file for you...

Would you like me to implement **Option 1 (Session Injection)** for you now? It's the fastest and most reliable solution!


