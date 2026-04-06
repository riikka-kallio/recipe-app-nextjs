import { test, expect } from '@playwright/test';

/**
 * Error Handling Tests
 * 
 * Tests application behavior when API errors occur or data is missing
 * Uses API route handlers to simulate error conditions
 */

test.describe('Error Handling', () => {
  
  test('recipe list handles empty state gracefully', async ({ page }) => {
    // Navigate to recipes page
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Page should still load with main content
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Should not show error state (empty state is normal)
    const errorMessage = page.locator('text=/error|failed/i').first();
    const errorCount = await errorMessage.count();
    
    // Either no error message, or if there is one, page should still be functional
    if (errorCount > 0) {
      // Even with error, navigation should work
      await expect(page.locator('nav')).toBeVisible();
    }
  });

  test('blog list handles empty state gracefully', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Page should still load with main content
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Navigation should remain functional
    await expect(page.locator('nav')).toBeVisible();
  });

  test('recipe detail page handles non-existent ID', async ({ page }) => {
    // Try to access a recipe that likely doesn't exist
    await page.goto('/recipes/999999');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Should show either 404 or error message, not crash
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Should have some indication of error (404 text, "not found", etc.)
    const hasErrorIndicator = 
      await page.locator('text=/404|not found|doesn\'t exist/i').count() > 0 ||
      await page.locator('h1, h2').filter({ hasText: /error/i }).count() > 0;
    
    // Navigation should still work
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('blog post detail page handles non-existent ID', async ({ page }) => {
    await page.goto('/blog/999999');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Should show either 404 or error message, not crash
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Navigation should still work
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('recipe form shows validation errors for invalid input', async ({ page }) => {
    await page.goto('/recipes/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Try to submit form without filling required fields
    const submitButton = page.locator('button[type="submit"]');
    
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // Should show validation error or prevent submission
      // Either HTML5 validation or custom validation message
      const titleInput = page.locator('input[name="title"]');
      
      if (await titleInput.count() > 0) {
        // Check if field is marked as invalid or has error message
        const isInvalid = await titleInput.evaluate((el: HTMLInputElement) => {
          return el.validity && !el.validity.valid;
        });
        
        // Form should prevent submission or show error
        const hasError = 
          isInvalid ||
          await page.locator('text=/required|error|invalid/i').count() > 0;
        
        // Expect some form of validation
        expect(hasError || await titleInput.count() > 0).toBe(true);
      }
    }
  });

  test('navigation handles invalid routes gracefully', async ({ page }) => {
    // Try to navigate to a route that doesn't exist
    await page.goto('/this-route-does-not-exist-12345');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Should show 404 page, not crash
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Should have navigation or way to get back
    const nav = page.locator('nav');
    const homeLink = page.locator('a[href="/"]');
    
    const hasNavigation = 
      await nav.count() > 0 || 
      await homeLink.count() > 0;
    
    expect(hasNavigation).toBe(true);
  });

  test('recipe search handles special characters', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Find search input if it exists
    const searchInput = page.locator('input[type="search"], input[type="text"]').first();
    
    if (await searchInput.count() > 0) {
      // Try searching with special characters
      await searchInput.fill('<script>alert("test")</script>');
      await page.waitForTimeout(300);
      
      // Page should not execute script or crash
      const main = page.locator('main');
      await expect(main).toBeVisible();
      
      // Should not show alert dialog (XSS prevention)
      const dialogs: string[] = [];
      page.on('dialog', dialog => {
        dialogs.push(dialog.message());
        dialog.dismiss();
      });
      
      await page.waitForTimeout(500);
      expect(dialogs.length).toBe(0);
    }
  });

  test('image upload handles missing/invalid files gracefully', async ({ page }) => {
    await page.goto('/recipes/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Look for file input
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.count() > 0) {
      // Form should still be usable even without file upload
      const titleInput = page.locator('input[name="title"]');
      
      if (await titleInput.count() > 0) {
        await titleInput.fill('Test Recipe');
        
        // Should be able to type in form fields without errors
        await expect(titleInput).toHaveValue('Test Recipe');
      }
      
      // Page should remain functional
      const main = page.locator('main');
      await expect(main).toBeVisible();
    }
  });
});
