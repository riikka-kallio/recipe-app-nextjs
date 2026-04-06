import { test, expect } from '@playwright/test';
import {
  checkAccessibility,
  checkKeyboardNavigation,
  checkColorContrast,
  checkFormLabels,
  checkHeadingHierarchy,
} from '../fixtures/accessibility';

test.describe('Blog Accessibility - WCAG AA Compliance', () => {
  
  test('blog list page has no accessibility violations', async ({ page }) => {
    await page.goto('/blog');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        await checkAccessibility(page, 'Blog Detail');
  });

  test('blog list page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const isValid = await checkHeadingHierarchy(page);
    expect(isValid).toBe(true);
  });

  test('blog list page has proper landmark regions', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Check for main landmark regions
    const main = page.locator('main');
    const nav = page.locator('nav');
    
    await expect(main).toBeVisible();
    await expect(nav).toBeVisible();
  });

  test('blog creation form has no accessibility violations', async ({ page }) => {
    await page.goto('/blog/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await checkAccessibility(page, 'Blog Creation Form');
  });

  test('blog creation form has proper labels', async ({ page }) => {
    await page.goto('/blog/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const hasLabels = await checkFormLabels(page);
    expect(hasLabels).toBe(true);
  });

  test('blog creation form supports keyboard navigation', async ({ page }) => {
    await page.goto('/blog/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Check basic keyboard navigation through form elements
    const inputNavigable = await checkKeyboardNavigation(page, 'input');
    expect(inputNavigable).toBe(true);
  });

  test('blog detail page has no accessibility violations', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Find first blog post detail link
    const postLinks = page.locator('a[href*="/blog/"]');
    const count = await postLinks.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await postLinks.nth(i).getAttribute('href');
      if (href && /\/blog\/\d+$/.test(href)) {
        await postLinks.nth(i).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await checkAccessibility(page, 'Blog List');
        return;
      }
    }
  });

  test('blog detail page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Find first blog post detail link
    const postLinks = page.locator('a[href*="/blog/"]');
    const count = await postLinks.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await postLinks.nth(i).getAttribute('href');
      if (href && /\/blog\/\d+$/.test(href)) {
        await postLinks.nth(i).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        const isValid = await checkHeadingHierarchy(page);
        expect(isValid).toBe(true);
        return;
      }
    }
  });
});
