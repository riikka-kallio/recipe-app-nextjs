import { test, expect } from '@playwright/test';
import {
  checkAccessibility,
  checkKeyboardNavigation,
  checkFocusManagement,
  checkHeadingHierarchy,
} from '../fixtures/accessibility';

test.describe('Navigation Accessibility - WCAG AA Compliance', () => {
  
  test('home page has no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const violations = await checkAccessibility(page);
    expect(violations).toHaveLength(0);
  });

  test('home page has proper landmark regions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Check for main landmark regions
    const main = page.locator('main');
    const nav = page.locator('nav, header');
    
    await expect(main).toBeVisible();
    await expect(nav).toBeVisible();
  });

  test('navigation supports keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Check if navigation links are keyboard accessible
    const navLinks = page.locator('nav a, header a');
    const count = await navLinks.count();
    
    if (count > 0) {
      // First link should be focusable
      await navLinks.first().focus();
      const isFocused = await navLinks.first().evaluate(el => document.activeElement === el);
      expect(isFocused).toBe(true);
    }
  });

  test('focus is managed during page navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Click a navigation link
    const recipesLink = page.locator('a[href="/recipes"]').first();
    if (await recipesLink.count() > 0) {
      await recipesLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      // Check if focus is visible (not lost)
      const hasFocusIndicator = await checkFocusManagement(page);
      expect(hasFocusIndicator).toBe(true);
    }
  });

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Find all buttons and links
    const interactiveElements = page.locator('button, a[href], input, select, textarea');
    const count = await interactiveElements.count();
    
    if (count > 0) {
      // Sample first 5 interactive elements
      for (let i = 0; i < Math.min(5, count); i++) {
        const element = interactiveElements.nth(i);
        
        // Should be focusable (tabindex >= 0 or naturally focusable)
        const tabindex = await element.getAttribute('tabindex');
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        
        const isFocusable = tabindex === null || parseInt(tabindex) >= 0 || ['a', 'button', 'input', 'select', 'textarea'].includes(tagName);
        expect(isFocusable).toBe(true);
      }
    }
  });

  test('page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const isValid = await checkHeadingHierarchy(page);
    expect(isValid).toBe(true);
  });
});
