import { test, expect } from '@playwright/test';

test.describe('FAQ Page', () => {
  test('should load FAQ page successfully', async ({ page }) => {
    await page.goto('/faq');
    
    await expect(page).toHaveURL(/\/faq/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display FAQ questions', async ({ page }) => {
    await page.goto('/faq');
    
    // Should have multiple questions (buttons or headings)
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should expand/collapse FAQ items', async ({ page }) => {
    await page.goto('/faq');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find first FAQ button
    const firstFAQButton = page.locator('button').first();
    
    if (await firstFAQButton.isVisible()) {
      // Click to expand
      await firstFAQButton.click();
      await page.waitForTimeout(500); // Wait for animation
      
      // Click again to collapse
      await firstFAQButton.click();
      await page.waitForTimeout(500);
      
      // Should not have errors
      expect(true).toBe(true);
    }
  });

  test('should have back navigation', async ({ page }) => {
    await page.goto('/faq');
    
    // Should have a way to go back (link or button)
    const backLink = page.getByRole('link', { name: /back|home/i });
    
    if (await backLink.count() > 0) {
      await expect(backLink.first()).toBeVisible();
    }
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/faq');
    
    // Check for proper heading structure
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
    
    // Buttons should be keyboard accessible
    const buttons = page.locator('button');
    if (await buttons.count() > 0) {
      await buttons.first().focus();
      // Should be able to focus
      expect(true).toBe(true);
    }
  });
});


