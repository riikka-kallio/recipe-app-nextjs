import { test, expect } from '@playwright/test';

/**
 * Recipe Management E2E Tests
 * 
 * Tests for recipe CRUD operations, forms, and cooking mode
 * Migrated from original Vite/React project to Next.js
 */

test.describe('Recipe Management - Core Flows', () => {
  
  test('recipe creation form is accessible', async ({ page }) => {
    await page.goto('/recipes/new');
    await page.waitForLoadState('networkidle');
    
    // Verify form elements exist
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('input[name="prep_time"]')).toBeVisible();
    await expect(page.locator('input[name="cook_time"]')).toBeVisible();
    await expect(page.locator('input[name="servings"]')).toBeVisible();
    
    // Verify submit button exists
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('recipe form has validation', async ({ page }) => {
    await page.goto('/recipes/new');
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    await page.locator('button[type="submit"]').click();
    
    // Should stay on form page (validation prevents navigation)
    await expect(page).toHaveURL('/recipes/new');
    
    // Should show validation errors
    const errorMessages = page.locator('text=/required/i');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test('recipes page loads and displays recipes', async ({ page }) => {
    await page.goto('/recipes');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Should have recipe elements or empty state
    const content = page.locator('main');
    await expect(content).toBeVisible();
    
    // Should have heading
    const heading = page.locator('h1', { hasText: /recipes/i });
    await expect(heading).toBeVisible();
  });

  test('recipe detail page loads', async ({ page }) => {
    // Go to recipes first
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    
    // Click on a recipe card (not the "new" link)
    const recipeCards = page.locator('a[href*="/recipes/"]');
    const count = await recipeCards.count();
    
    // Try to find a recipe that's not /recipes/new
    let foundRecipe = false;
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await recipeCards.nth(i).getAttribute('href');
      if (href && /\/recipes\/\d+$/.test(href)) {
        await recipeCards.nth(i).click();
        foundRecipe = true;
        break;
      }
    }
    
    if (foundRecipe) {
      // Should navigate to recipe detail
      await expect(page).toHaveURL(/\/recipes\/\d+$/);
      await page.waitForLoadState('networkidle');
      
      // Should show recipe content
      const main = page.locator('main');
      await expect(main).toBeVisible();
      
      // Should have title
      const title = page.locator('h1');
      await expect(title).toBeVisible();
    }
  });

  test('cooking mode page loads', async ({ page }) => {
    // Go to recipes
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    
    // Find a recipe detail page
    const recipeCards = page.locator('a[href*="/recipes/"]');
    const count = await recipeCards.count();
    
    let foundRecipe = false;
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await recipeCards.nth(i).getAttribute('href');
      if (href && /\/recipes\/\d+$/.test(href)) {
        await recipeCards.nth(i).click();
        foundRecipe = true;
        break;
      }
    }
    
    if (foundRecipe) {
      await expect(page).toHaveURL(/\/recipes\/\d+$/);
      await page.waitForLoadState('networkidle');
      
      // Look for "Start Cooking" or "Cook" button/link
      const cookButton = page.locator('button, a').filter({ hasText: /cook|start cooking/i });
      const buttonCount = await cookButton.count();
      
      if (buttonCount > 0) {
        await cookButton.first().click();
        
        // Should load cooking mode
        await expect(page).toHaveURL(/\/recipes\/\d+\/cook$/);
        await page.waitForLoadState('networkidle');
        
        // Should show cooking mode interface
        const main = page.locator('main');
        await expect(main).toBeVisible();
      }
    }
  });
});
