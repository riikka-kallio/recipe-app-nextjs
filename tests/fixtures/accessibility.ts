import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Testing Utilities
 * 
 * Provides helper functions for testing WCAG 2.1 Level AA compliance
 * using @axe-core/playwright
 */

/**
 * Run axe accessibility scan on current page
 * Validates WCAG 2.1 Level AA compliance
 * 
 * @param page - Playwright page object
 * @param context - Optional context description for error messages
 * 
 * @example
 * await checkAccessibility(page, 'Recipe Detail Page');
 */
export async function checkAccessibility(page: Page, context?: string) {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const violations = accessibilityScanResults.violations;
  
  if (violations.length > 0) {
    console.log(`\n❌ Accessibility violations found${context ? ` in ${context}` : ''}:`);
    violations.forEach(violation => {
      console.log(`  - ${violation.id}: ${violation.description}`);
      console.log(`    Impact: ${violation.impact}`);
      console.log(`    Affected elements: ${violation.nodes.length}`);
      violation.nodes.forEach((node, i) => {
        if (i < 3) { // Show first 3 affected elements
          console.log(`      • ${node.html.substring(0, 100)}...`);
        }
      });
    });
  }

  expect(violations).toEqual([]);
}

/**
 * Check keyboard navigation works for a specific element
 * Verifies element can be focused with Tab key
 * 
 * @param page - Playwright page object
 * @param selector - CSS selector for element to check
 * 
 * @example
 * await checkKeyboardNavigation(page, 'input[name="title"]');
 */
export async function checkKeyboardNavigation(page: Page, selector: string) {
  await page.keyboard.press('Tab');
  const focused = await page.locator(selector).evaluate(el => 
    el === document.activeElement
  );
  expect(focused).toBeTruthy();
}

/**
 * Check color contrast meets WCAG AA standards
 * Validates 4.5:1 ratio for normal text, 3:1 for large text
 * 
 * @param page - Playwright page object
 * 
 * @example
 * await checkColorContrast(page);
 */
export async function checkColorContrast(page: Page) {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['color-contrast'])
    .analyze();

  if (accessibilityScanResults.violations.length > 0) {
    console.log('\n❌ Color contrast violations:');
    accessibilityScanResults.violations.forEach(v => {
      console.log(`  - ${v.description}`);
      v.nodes.forEach(node => {
        console.log(`    • ${node.html.substring(0, 80)}...`);
      });
    });
  }

  expect(accessibilityScanResults.violations).toEqual([]);
}

/**
 * Check ARIA attributes are correct for elements with specific role
 * Verifies expected number of elements with given ARIA role exist
 * 
 * @param page - Playwright page object
 * @param role - ARIA role to check
 * @param expectedCount - Minimum expected number of elements
 * 
 * @example
 * await checkAriaAttributes(page, 'button', 3);
 */
export async function checkAriaAttributes(page: Page, role: string, expectedCount: number) {
  const elements = page.locator(`[role="${role}"]`);
  const count = await elements.count();
  expect(count).toBeGreaterThanOrEqual(expectedCount);
}

/**
 * Check focus management is correct
 * Verifies focus order is logical and focus isn't lost
 * 
 * @param page - Playwright page object
 * 
 * @example
 * await checkFocusManagement(page);
 */
export async function checkFocusManagement(page: Page) {
  // Get all focusable elements
  const focusableElements = await page.locator(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ).all();

  // Verify at least some focusable elements exist
  expect(focusableElements.length).toBeGreaterThan(0);

  // Tab through first few elements and verify focus changes
  if (focusableElements.length >= 2) {
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();

    await page.keyboard.press('Tab');
    const secondFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(secondFocused).toBeTruthy();
    
    // Focus should have changed
    expect(firstFocused).not.toEqual(secondFocused);
  }
}

/**
 * Check screen reader text exists for visual-only information
 * Verifies .sr-only or aria-label alternatives exist
 * 
 * @param page - Playwright page object
 * @param expectedText - Text that should be available to screen readers
 * 
 * @example
 * await checkScreenReaderText(page, 'Loading');
 */
export async function checkScreenReaderText(page: Page, expectedText: string) {
  // Check for .sr-only elements with the text
  const srOnlyElement = page.locator('.sr-only').filter({ hasText: expectedText });
  const srOnlyCount = await srOnlyElement.count();

  // Check for aria-label with the text
  const ariaLabelElement = page.locator(`[aria-label*="${expectedText}"]`);
  const ariaLabelCount = await ariaLabelElement.count();

  // At least one should exist
  expect(srOnlyCount + ariaLabelCount).toBeGreaterThan(0);
}

/**
 * Check that headings follow proper hierarchy
 * Verifies h1, h2, h3, etc. are used in correct order
 * 
 * @param page - Playwright page object
 * 
 * @example
 * await checkHeadingHierarchy(page);
 */
export async function checkHeadingHierarchy(page: Page) {
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  
  if (headings.length === 0) {
    throw new Error('No headings found on page');
  }

  // Check that there's exactly one h1
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBe(1);

  // Get heading levels
  const headingLevels = await Promise.all(
    headings.map(async (heading) => {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      return parseInt(tagName.substring(1));
    })
  );

  // Verify no skipped levels (e.g., h1 -> h3 without h2)
  for (let i = 1; i < headingLevels.length; i++) {
    const prevLevel = headingLevels[i - 1];
    const currentLevel = headingLevels[i];
    
    // Current level should be same, +1, or lower (but not skip levels going down)
    const levelDiff = currentLevel - prevLevel;
    
    if (levelDiff > 1) {
      throw new Error(
        `Heading hierarchy violation: jumped from h${prevLevel} to h${currentLevel} (skipped h${prevLevel + 1})`
      );
    }
  }
}

/**
 * Check that form fields have proper labels
 * Verifies all inputs have associated label or aria-label
 * 
 * @param page - Playwright page object
 * 
 * @example
 * await checkFormLabels(page);
 */
export async function checkFormLabels(page: Page) {
  const inputs = await page.locator('input, select, textarea').all();
  
  for (const input of inputs) {
    const inputId = await input.getAttribute('id');
    const inputName = await input.getAttribute('name');
    const ariaLabel = await input.getAttribute('aria-label');
    const ariaLabelledBy = await input.getAttribute('aria-labelledby');
    
    // Check if there's a label for this input
    let hasLabel = false;
    
    if (inputId) {
      const label = await page.locator(`label[for="${inputId}"]`).count();
      hasLabel = label > 0;
    }
    
    // Or has aria-label
    if (ariaLabel) {
      hasLabel = true;
    }
    
    // Or has aria-labelledby
    if (ariaLabelledBy) {
      hasLabel = true;
    }
    
    if (!hasLabel) {
      const inputType = await input.getAttribute('type');
      const inputHtml = await input.evaluate(el => el.outerHTML.substring(0, 100));
      throw new Error(
        `Form input without label found: ${inputHtml}... (id: ${inputId}, name: ${inputName}, type: ${inputType})`
      );
    }
  }
}
