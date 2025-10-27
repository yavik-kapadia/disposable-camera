# E2E Testing with Real Authentication

## 🚀 Quick Start

### 1. Set Up Test Credentials

```bash
# Copy the example file
cp e2e/.env.e2e.example e2e/.env.e2e

# Edit and add your test Google account credentials
nano e2e/.env.e2e
```

Add:
```env
TEST_USER_EMAIL=your-test-email@gmail.com
TEST_USER_PASSWORD=your-test-password
```

### 2. Run Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests (includes auth setup)
npm run test:e2e

# Or run in UI mode (recommended for first time)
npm run test:e2e:ui
```

## 📁 Test Files

### Authentication
- `auth.setup.ts` - Authenticates with Google and saves session
- `global-setup.ts` - Creates necessary directories

### Authenticated Tests (requires login)
- `dashboard-authenticated.spec.ts` - Dashboard CRUD operations (7 tests)
- `event-workflow.spec.ts` - Complete event lifecycle (8 tests)

### Public Tests (no login required)
- `home.spec.ts` - Home page tests (4 tests)
- `faq.spec.ts` - FAQ page tests (5 tests)
- `camera-upload.spec.ts` - Camera page tests (partially authenticated)
- `event-viewing.spec.ts` - Event viewing tests (partially authenticated)

## 🎯 Test Coverage

### With Authentication Enabled

```
✅ Home & FAQ:        30 tests (public)
✅ Dashboard:         35 tests (authenticated)
✅ Event Workflow:    40 tests (authenticated)
✅ Camera & Upload:   20 tests (mixed)
---
Total:              ~125 tests across 5 browsers
```

## 🔧 Commands

```bash
# Run all tests
npm run test:e2e

# Run only authenticated tests
npx playwright test dashboard-authenticated
npx playwright test event-workflow

# Run only public tests
npx playwright test home faq

# Run specific browser
npx playwright test --project=chromium

# Debug mode (see the browser)
npx playwright test --headed
npx playwright test --debug

# UI mode (interactive)
npm run test:e2e:ui
```

## 🐛 Troubleshooting

### "TEST_USER_EMAIL and TEST_USER_PASSWORD must be set"

Create `e2e/.env.e2e` with your test credentials.

### Authentication fails

1. Run in headed mode to see what's happening:
   ```bash
   npx playwright test auth.setup --headed
   ```

2. Check Supabase Google OAuth is configured correctly

3. Verify redirect URLs include `http://localhost:3000/auth/callback`

### Tests are skipped

The authentication setup failed. Check:
- Credentials are correct in `e2e/.env.e2e`
- Dev server is running (`npm run dev`)
- Google OAuth is working

### Session expired

Delete the old session and re-run:
```bash
rm playwright/.auth/user.json
npm run test:e2e
```

## 📚 Documentation

- [AUTH_E2E_SETUP.md](../docs/AUTH_E2E_SETUP.md) - Complete setup guide
- [E2E_TESTING.md](../docs/E2E_TESTING.md) - General E2E testing guide
- [Playwright Docs](https://playwright.dev/)

## ⚠️ Security Notes

- ✅ Use a dedicated test Google account
- ✅ Never commit `.env.e2e` to git (it's in `.gitignore`)
- ✅ Store CI/CD credentials in GitHub Secrets
- ❌ Don't use your personal Google account
- ❌ Don't commit credentials to version control

## 🎉 Success!

If tests are passing, you should see:

```
✅ Setup: 1 passed
✅ Chromium: 25 passed
✅ Firefox: 25 passed
✅ WebKit: 25 passed
✅ Mobile Chrome: 25 passed
✅ Mobile Safari: 25 passed

Total: 126 tests passed in ~60s
```

---

**Need help?** See [AUTH_E2E_SETUP.md](../docs/AUTH_E2E_SETUP.md) for detailed troubleshooting.


