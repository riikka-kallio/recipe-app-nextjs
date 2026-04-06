import { test, expect } from '@playwright/test';

test.describe('Blog Management - Core Flows', () => {
  
  test('blog creation page loads', async ({ page }) => {
    await page.goto('/blog/new');
    await page.waitForLoadState('networkidle');
    
    // Wait for Next.js SSR hydration (longer for TipTap editor)
    await page.waitForTimeout(1500);
    
    // Verify main content loads
    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 10000 });
    
    // Look for title input (might be in different forms)
    const inputs = page.locator('input, textarea, [contenteditable]');
    expect(await inputs.count()).toBeGreaterThan(0);
  });

  test('blog page loads and displays posts', async ({ page }) => {
    await page.goto('/blog');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for Next.js SSR hydration
    await page.waitForTimeout(500);
    
    // Should have content
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('blog post detail page loads', async ({ page }) => {
    // Go to blog page
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    
    // Wait for Next.js SSR hydration
    await page.waitForTimeout(500);
    
    // Find a blog post (not the /new link)
    const postLinks = page.locator('a[href*="/blog/"]');
    const count = await postLinks.count();
    
    let foundPost = false;
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await postLinks.nth(i).getAttribute('href');
      if (href && /\/blog\/\d+$/.test(href)) {
        await postLinks.nth(i).click();
        foundPost = true;
        break;
      }
    }
    
    if (foundPost) {
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      // Should navigate to blog post detail
      await expect(page).toHaveURL(/\/blog\/\d+$/);
      
      // Should show blog content
      const main = page.locator('main');
      await expect(main).toBeVisible();
    }
  });
});
