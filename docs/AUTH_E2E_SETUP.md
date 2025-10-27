# Authenticated E2E Testing Setup

This guide explains how to set up and run E2E tests that use real Google authentication.

## 📋 Prerequisites

You need a **dedicated test Google account** for E2E testing. **Do not use your personal Google account**.

### Creating a Test Google Account

1. Go to [accounts.google.com](https://accounts.google.com)
2. Create a new Google account specifically for testing
3. Use a memorable password (you'll need it for automation)
4. Save the credentials securely

## 🔧 Setup Steps

### 1. Install Dependencies

```bash
npm install
npx playwright install
```

### 2. Configure Test Credentials

Create the E2E environment file:

```bash
cp e2e/.env.e2e.example e2e/.env.e2e
```

Edit `e2e/.env.e2e` and add your test credentials:

```env
TEST_USER_EMAIL=your-test-account@gmail.com
TEST_USER_PASSWORD=your-test-password
```

**⚠️ IMPORTANT**: This file is git-ignored. Never commit real credentials!

### 3. Verify Supabase Configuration

Ensure your Supabase project allows Google OAuth:

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add authorized redirect URLs:
   - `http://localhost:3000/auth/callback`
   - Your production URL callback

### 4. Run Authentication Setup

The authentication setup runs automatically before tests:

```bash
npm run test:e2e
```

This will:
1. Open a browser
2. Navigate to your app
3. Click "Sign in with Google"
4. Fill in test credentials
5. Complete OAuth flow
6. Save authenticated session

## 🚀 Running Tests

### Run All Tests (Including Authenticated)

```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode (recommended for first time)
npm run test:e2e:ui

# Run only authenticated tests
npx playwright test dashboard-authenticated

# Run full workflow test
npx playwright test event-workflow
```

### Run Unauthenticated Tests Only

```bash
npx playwright test --project=chromium-no-auth
```

## 📂 Test Structure

### Authenticated Tests
These tests require a logged-in user:

- `dashboard-authenticated.spec.ts` - Dashboard CRUD operations
- `event-workflow.spec.ts` - Complete event lifecycle
- Future: Photo upload, gallery management, etc.

### Unauthenticated Tests
These tests work without login:

- `home.spec.ts` - Home page
- `faq.spec.ts` - FAQ page
- `camera-upload.spec.ts` - Public camera pages (partial)

## 🔐 How Authentication Works

### 1. Setup Phase (`auth.setup.ts`)

```typescript
// Runs once before all tests
test('authenticate with Google', async ({ page }) => {
  1. Navigate to app
  2. Click "Sign in with Google"
  3. Fill credentials in Google OAuth popup
  4. Wait for redirect to dashboard
  5. Save session to playwright/.auth/user.json
});
```

### 2. Test Phase

```typescript
// Each test reuses the saved session
test('dashboard test', async ({ page }) => {
  // Already logged in!
  await page.goto('/dashboard');
  // ... test authenticated features
});
```

### 3. Session Management

- Session is saved to `playwright/.auth/user.json`
- All browsers reuse this session
- Session persists across test runs
- If expired, re-run setup

## 🐛 Troubleshooting

### Authentication Fails

**Error**: "TEST_USER_EMAIL and TEST_USER_PASSWORD must be set"

**Solution**: Verify `e2e/.env.e2e` file exists and has correct credentials

---

**Error**: Google shows "This browser or app may not be secure"

**Solution**: 
- Use a test account, not your personal account
- Enable "Less secure app access" in Google Account settings
- Or use Google's test accounts if available

---

**Error**: "Timeout waiting for dashboard"

**Solution**:
1. Check Supabase Google OAuth is configured
2. Verify redirect URLs include `http://localhost:3000/auth/callback`
3. Run in headed mode to see what's happening: `npx playwright test auth.setup --headed`

### Tests Skip or Fail

**Error**: Tests marked as "skipped" or "dependency not met"

**Solution**: The setup test failed. Run authentication setup manually:

```bash
npx playwright test auth.setup --headed
```

Watch the browser and see where it fails.

### Session Expired

**Error**: Tests redirect to login page

**Solution**: Delete old session and re-authenticate:

```bash
rm playwright/.auth/user.json
npm run test:e2e
```

### Google Captcha

**Error**: Google shows "Prove you're not a robot"

**Solution**:
- Use a well-established test account
- Run tests from the same IP consistently
- Consider using Google's official test accounts
- Use `--headed` mode and solve captcha manually for the session

## 🔒 Security Best Practices

### DO ✅

- Use a dedicated test Google account
- Store credentials in `.env.e2e` (git-ignored)
- Use different credentials for CI/CD (via secrets)
- Rotate test account password periodically
- Delete test data after test runs

### DON'T ❌

- Don't use your personal Google account
- Don't commit `.env.e2e` to git
- Don't share test credentials publicly
- Don't use production database for tests
- Don't store credentials in test files

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Create E2E env file
        run: |
          echo "TEST_USER_EMAIL=${{ secrets.TEST_USER_EMAIL }}" > e2e/.env.e2e
          echo "TEST_USER_PASSWORD=${{ secrets.TEST_USER_PASSWORD }}" >> e2e/.env.e2e
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Setting GitHub Secrets

1. Go to your repo → Settings → Secrets and variables → Actions
2. Add secrets:
   - `TEST_USER_EMAIL`
   - `TEST_USER_PASSWORD`

## 📊 What Gets Tested

### Dashboard Tests (`dashboard-authenticated.spec.ts`)

- ✅ Load dashboard after auth
- ✅ Create new event
- ✅ View event details
- ✅ Get event access code
- ✅ Navigate to camera page
- ✅ Toggle event status
- ✅ Delete event
- ✅ Sign out

### Event Workflow Tests (`event-workflow.spec.ts`)

- ✅ Complete event lifecycle
- ✅ Create → Share → Upload → View
- ✅ Access code generation
- ✅ QR code display
- ✅ Event statistics
- ✅ Gallery access

## 🎯 Coverage

With authenticated tests enabled:

```
Total E2E Tests: ~100+ tests
- Home/FAQ: 30 tests (unauthenticated)
- Camera: 40 tests (partial auth)
- Dashboard: 35 tests (authenticated)
- Workflows: 10 tests (authenticated)

Browsers: 5 (Chrome, Firefox, Safari, Mobile)
Pass Rate: ~95%+ (with valid credentials)
```

## 📚 Additional Resources

- [Playwright Authentication Docs](https://playwright.dev/docs/auth)
- [Google OAuth Testing Guide](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

## ✅ Verification Checklist

Before running authenticated tests:

- [ ] Created dedicated test Google account
- [ ] Created `e2e/.env.e2e` with credentials
- [ ] Verified Supabase Google OAuth is enabled
- [ ] Added redirect URLs to Supabase
- [ ] Installed Playwright browsers
- [ ] Tested auth setup manually: `npx playwright test auth.setup --headed`
- [ ] Confirmed session saved to `playwright/.auth/user.json`
- [ ] Ran full test suite: `npm run test:e2e`

---

**Ready to test!** 🚀

If you encounter issues, run tests in headed mode to see what's happening:

```bash
npx playwright test --headed --project=setup
npx playwright test dashboard-authenticated --headed
```


