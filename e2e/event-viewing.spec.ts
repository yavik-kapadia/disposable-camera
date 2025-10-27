import { test, expect } from '@playwright/test';

test.describe('Event Viewing Flow', () => {
  test('should handle invalid event ID gracefully', async ({ page }) => {
    await page.goto('/event/invalid-event-id-12345');
    
    // Should not crash, page should render
    await expect(page.locator('body')).toBeVisible();
    
    // Should show some kind of error or "not found" message (or empty gallery)
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });

  test('should load event page structure without crashing', async ({ page }) => {
    const errors: string[] = [];
    
    // Set up error listener
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate to event route (will show error or loading state)
    await page.goto('/event/test-nonexistent-event');
    await page.waitForLoadState('networkidle');
    
    // Page should render without crashing
    await expect(page.locator('body')).toBeVisible();
    
    // Allow page to settle
    await page.waitForTimeout(2000);
    
    // Filter out expected errors (network/API errors for non-existent events)
    const criticalErrors = errors.filter(
      (err) => 
        !err.includes('NetworkError') && 
        !err.includes('404') &&
        !err.includes('400') &&
        !err.includes('Failed to fetch') &&
        !err.includes('Failed to load resource') &&
        !err.toLowerCase().includes('supabase') &&
        !err.includes('network request')
    );
    
    if (criticalErrors.length > 0) {
      console.log('❌ Critical errors found:', criticalErrors);
    }
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should display event page with created event', async ({ page }) => {
    // First, create an event via dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /create event|new event/i });
    await createButton.click();
    await page.waitForTimeout(500);
    
    const eventName = `E2E Event View ${Date.now()}`;
    await page.getByPlaceholder(/sarah's birthday party/i).fill(eventName);
    await page.getByRole('button', { name: /create|submit/i }).click();
    await page.waitForTimeout(2000);

    // Get the event ID from URL or page content
    const pageContent = await page.textContent('body');
    const accessCodeMatch = pageContent?.match(/[A-Z0-9]{3,6}-?[A-Z0-9]{3,6}/);
    
    if (accessCodeMatch) {
      const accessCode = accessCodeMatch[0];
      
      // Navigate to event viewing page (might use event ID or access code)
      // Try to find a "View" or "Gallery" button
      const viewButton = page.getByRole('link', { name: /view|gallery|see photos/i }).first();
      
      if (await viewButton.isVisible().catch(() => false)) {
        await viewButton.click();
        await page.waitForLoadState('networkidle');
        
        // Should be on event page
        const url = page.url();
        expect(url).toMatch(/event\/|gallery\//);
        
        // Page should have loaded
        await expect(page.locator('body')).toBeVisible();
        
        // Should show event name or gallery UI
        const hasEventUI = 
          await page.getByText(eventName).isVisible().catch(() => false) ||
          await page.getByText(/photos|gallery|images/i).isVisible().catch(() => false) ||
          await page.getByText(/no photos yet|upload photos/i).isVisible().catch(() => false);
        
        expect(hasEventUI).toBe(true);
      }
    }
  });
});
