import { test, expect } from '@playwright/test';
import {
  checkAccessibility,
  checkKeyboardNavigation,
  checkColorContrast,
  checkFormLabels,
  checkHeadingHierarchy,
  checkFocusManagement,
} from '../fixtures/accessibility';

test.describe('Recipes Accessibility - WCAG AA Compliance', () => {
  
  test('recipes list page has no accessibility violations', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Run axe accessibility scan
    const violations = await checkAccessibility(page);
    expect(violations).toHaveLength(0);
  });

  test('recipes list page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const isValid = await checkHeadingHierarchy(page);
    expect(isValid).toBe(true);
  });

  test('recipes list page has proper landmark regions', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Check for main landmark regions
    const main = page.locator('main');
    const nav = page.locator('nav');
    
    await expect(main).toBeVisible();
    await expect(nav).toBeVisible();
  });

  test('recipes list page has sufficient color contrast', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const hasGoodContrast = await checkColorContrast(page);
    expect(hasGoodContrast).toBe(true);
  });

  test('recipe creation form has no accessibility violations', async ({ page }) => {
    await page.goto('/recipes/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const violations = await checkAccessibility(page);
    expect(violations).toHaveLength(0);
  });

  test('recipe creation form has proper labels', async ({ page }) => {
    await page.goto('/recipes/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const hasLabels = await checkFormLabels(page);
    expect(hasLabels).toBe(true);
  });

  test('recipe creation form supports keyboard navigation', async ({ page }) => {
    await page.goto('/recipes/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Test keyboard navigation for key form elements
    const titleInput = await checkKeyboardNavigation(page, 'input[name="title"]');
    expect(titleInput).toBe(true);
  });

  test('recipe detail page has no accessibility violations', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Find first recipe detail link
    const recipeLinks = page.locator('a[href*="/recipes/"]');
    const count = await recipeLinks.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await recipeLinks.nth(i).getAttribute('href');
      if (href && /\/recipes\/\d+$/.test(href)) {
        await recipeLinks.nth(i).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        const violations = await checkAccessibility(page);
        expect(violations).toHaveLength(0);
        return;
      }
    }
  });

  test('recipe detail page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Find first recipe detail link
    const recipeLinks = page.locator('a[href*="/recipes/"]');
    const count = await recipeLinks.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await recipeLinks.nth(i).getAttribute('href');
      if (href && /\/recipes\/\d+$/.test(href)) {
        await recipeLinks.nth(i).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        const isValid = await checkHeadingHierarchy(page);
        expect(isValid).toBe(true);
        return;
      }
    }
  });

  test('recipe cards have proper ARIA attributes', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Check if recipe cards have proper structure
    const recipeCards = page.locator('article, [role="article"], [data-testid*="recipe-card"]');
    const count = await recipeCards.count();
    
    if (count > 0) {
      // At least one card should be visible
      await expect(recipeCards.first()).toBeVisible();
      
      // Cards should have accessible names (via heading or aria-label)
      const firstCard = recipeCards.first();
      const hasHeading = await firstCard.locator('h1, h2, h3, h4, h5, h6').count() > 0;
      const hasAriaLabel = await firstCard.getAttribute('aria-label') !== null;
      
      expect(hasHeading || hasAriaLabel).toBe(true);
    }
  });
});
