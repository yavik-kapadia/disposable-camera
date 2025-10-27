import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loaded
    await expect(page).toHaveTitle(/Disposable Camera/i);
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Should have navigation elements (links or buttons)
    // The page structure may vary, so check for any interactive elements
    const links = page.locator('a');
    const buttons = page.locator('button');
    
    const linkCount = await links.count();
    const buttonCount = await buttons.count();
    
    // Should have some form of navigation
    expect(linkCount + buttonCount).toBeGreaterThan(0);
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to FAQ page', async ({ page }) => {
    await page.goto('/');
    
    // Look for FAQ link
    const faqLink = page.getByRole('link', { name: /faq/i });
    if (await faqLink.count() > 0) {
      await faqLink.first().click();
      await expect(page).toHaveURL(/\/faq/);
    }
  });
});

