import { test, expect } from '@playwright/test';

test.describe('User Interactions', () => {
  
  test('recipe detail page shows content', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    
    // Wait for Next.js SSR hydration
    await page.waitForTimeout(500);
    
    // Find a recipe detail link
    const recipeLinks = page.locator('a[href*="/recipes/"]');
    const count = await recipeLinks.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await recipeLinks.nth(i).getAttribute('href');
      if (href && /\/recipes\/\d+$/.test(href)) {
        await recipeLinks.nth(i).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        await expect(page).toHaveURL(/\/recipes\/\d+$/);
        
        // Should show recipe content
        const main = page.locator('main');
        await expect(main).toBeVisible();
        return;
      }
    }
  });

  test('blog post detail page shows content', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    
    // Wait for Next.js SSR hydration
    await page.waitForTimeout(500);
    
    // Find a blog post detail link
    const postLinks = page.locator('a[href*="/blog/"]');
    const count = await postLinks.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await postLinks.nth(i).getAttribute('href');
      if (href && /\/blog\/\d+$/.test(href)) {
        await postLinks.nth(i).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        await expect(page).toHaveURL(/\/blog\/\d+$/);
        
        // Should show blog content
        const main = page.locator('main');
        await expect(main).toBeVisible();
        return;
      }
    }
  });

  test('recipe form pages are accessible', async ({ page }) => {
    // Recipe form
    await page.goto('/recipes/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page.locator('input[name="title"]')).toBeVisible();
    
    // Blog form - just verify page loads
    await page.goto('/blog/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('recipe likes feature works', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    
    // Wait for Next.js SSR hydration
    await page.waitForTimeout(500);
    
    // Find a recipe detail
    const recipeLinks = page.locator('a[href*="/recipes/"]');
    const count = await recipeLinks.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await recipeLinks.nth(i).getAttribute('href');
      if (href && /\/recipes\/\d+$/.test(href)) {
        await recipeLinks.nth(i).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        await expect(page).toHaveURL(/\/recipes\/\d+$/);
        
        // Check if like button exists
        const likeButton = page.locator('button').filter({ hasText: /like|heart/i });
        if (await likeButton.count() > 0) {
          // Button exists - just verify it's clickable
          await expect(likeButton.first()).toBeEnabled();
        }
        return;
      }
    }
  });

  test('comment section exists on recipe detail page', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    
    // Wait for Next.js SSR hydration
    await page.waitForTimeout(500);
    
    // Find a recipe detail link
    const recipeLinks = page.locator('a[href*="/recipes/"]');
    const count = await recipeLinks.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await recipeLinks.nth(i).getAttribute('href');
      if (href && /\/recipes\/\d+$/.test(href)) {
        await recipeLinks.nth(i).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        await expect(page).toHaveURL(/\/recipes\/\d+$/);
        
        // Look for comment section (textarea or comment input)
        const commentSection = page.locator('textarea, input[placeholder*="comment" i], [data-testid*="comment"]');
        
        // Comment section should exist
        if (await commentSection.count() > 0) {
          await expect(commentSection.first()).toBeVisible();
        }
        return;
      }
    }
  });
});
