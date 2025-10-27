import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

/**
 * Playwright E2E Configuration
 * 
 * Uses simple session injection for authentication.
 */
export default defineConfig({
  testDir: './e2e',
  
  // Global setup for authentication
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project - creates authenticated session
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Authenticated tests
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /.*\.(home|faq)\.spec\.ts/,
    },

    // Public tests (no auth)
    {
      name: 'chromium-public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.(home|faq)\.spec\.ts/,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
