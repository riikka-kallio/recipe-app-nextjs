import { test, expect } from '@playwright/test';

test.describe('Navigation and Search', () => {
  
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for Next.js SSR hydration
    await page.waitForTimeout(500);
    
    // Should have navigation
    const nav = page.locator('nav, header');
    await expect(nav).toBeVisible();
    
    // Should have main content
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for Next.js SSR hydration
    await page.waitForTimeout(500);
    
    // Click recipes link
    const recipesLink = page.locator('a[href="/recipes"]').first();
    if (await recipesLink.count() > 0) {
      await recipesLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/recipes');
    }
  });

  test('recipes page has filter/search section', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    
    // Wait for Next.js SSR hydration
    await page.waitForTimeout(500);
    
    // Should have search or filter inputs
    const inputs = page.locator('input[type="text"], input[type="search"], select');
    const hasFilters = await inputs.count() > 0;
    expect(hasFilters).toBeTruthy();
  });

  test('blog page has filter/search section', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    
    // Wait for Next.js SSR hydration
    await page.waitForTimeout(500);
    
    // Should have search or filter inputs
    const inputs = page.locator('input[type="text"], input[type="search"], select');
    const hasFilters = await inputs.count() > 0;
    expect(hasFilters).toBeTruthy();
  });
});
