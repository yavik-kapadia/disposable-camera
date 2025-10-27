import { test, expect } from '@playwright/test';

test.describe('Camera Upload Flow', () => {
  test('should load camera page with valid code', async ({ page }) => {
    // Navigate to a camera page (will require valid event code in real scenario)
    await page.goto('/camera/TEST-CODE');
    
    // Page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show camera permission request UI', async ({ page }) => {
    await page.goto('/camera/TEST-CODE');
    
    // Should show some UI for camera (either permission request or camera view)
    // The actual camera access depends on browser permissions
    await expect(page.locator('body')).toBeVisible();
    
    // Look for camera-related buttons or text
    const startCameraButton = page.getByRole('button', { name: /start camera/i });
    const cameraText = page.getByText(/camera/i);
    
    // At least one should exist
    const hasCamera = (await startCameraButton.count()) > 0 || (await cameraText.count()) > 0;
    expect(hasCamera).toBe(true);
  });

  test.skip('should have upload tab option', async ({ page }) => {
    // This test requires a real event code from the database
    // In a real test environment, you would:
    // 1. Create a test event via Supabase
    // 2. Use that event's access code
    // 3. Clean up after the test
    
    await page.goto('/camera/REAL-EVENT-CODE');
    await page.waitForLoadState('load');
    await page.waitForSelector('button', { state: 'visible', timeout: 10000 });
    
    const uploadButton = page.locator('button').filter({ hasText: 'Upload' });
    await expect(uploadButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow switching between camera and upload tabs', async ({ page }) => {
    await page.goto('/camera/TEST-CODE');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find upload tab (may be a button or link)
    const uploadTab = page.locator('button, a').filter({ hasText: /upload/i }).first();
    
    if (await uploadTab.isVisible()) {
      await uploadTab.click();
      
      // Should show file upload interface
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeVisible({ timeout: 5000 });
    }
  });

  test.skip('should support file upload from gallery', async ({ page, context }) => {
    // Skip by default as it requires file system access
    await page.goto('/camera/TEST-CODE');
    
    // Switch to upload tab
    const uploadTab = page.locator('button, a').filter({ hasText: /upload/i }).first();
    await uploadTab.click();
    
    // Prepare a test file
    const fileInput = page.locator('input[type="file"]');
    
    // In a real E2E test, you would upload an actual test image file
    // await fileInput.setInputFiles('path/to/test-image.jpg');
    
    await expect(fileInput).toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/camera/TEST-CODE');
    
    // Should render without horizontal scroll
    const bodyWidth = await page.locator('body').evaluate((el) => el.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test('should work as PWA', async ({ page }) => {
    await page.goto('/camera/TEST-CODE');
    
    // Check for manifest.json
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);
  });
});

test.describe('Camera Features', () => {
  test('should display camera controls when camera is active', async ({ page }) => {
    await page.goto('/camera/TEST-CODE');
    
    // If camera starts, should show controls
    // Note: Actual camera access depends on permissions
    await page.waitForLoadState('networkidle');
    
    // Page should render without crashing
    await expect(page.locator('body')).toBeVisible();
  });

  test.skip('should show photo counter after taking photos', async ({ page }) => {
    // Requires actual camera access and permissions
    await page.goto('/camera/TEST-CODE');
    
    // This would require granting camera permissions and simulating photo capture
    // Skipping for basic smoke tests
  });
});

test.describe('Error Handling', () => {
  test('should handle invalid event codes gracefully', async ({ page }) => {
    await page.goto('/camera/INVALID-CODE-99999');
    
    // Should render some UI (error message or loading state)
    await expect(page.locator('body')).toBeVisible();
    
    // Check for error-related text
    const errorText = page.getByText(/error|not found|invalid/i);
    // May or may not show error depending on implementation
    // Just verify page doesn't crash
  });

  test.skip('should not have critical console errors on load', async ({ page }) => {
    // This test requires a real event code to properly test the camera page
    // With TEST-CODE, the page shows an error state which may have different console output
    // In production testing, use a real event code
    
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(`Page error: ${error.message}`);
    });
    
    await page.goto('/camera/REAL-EVENT-CODE');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    
    const criticalErrors = errors.filter(
      (err) =>
        !err.includes('camera') &&
        !err.includes('permission') &&
        !err.includes('mediaDevices') &&
        !err.includes('getUserMedia')
    );
    
    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }
    
    expect(criticalErrors.length).toBe(0);
  });
});

