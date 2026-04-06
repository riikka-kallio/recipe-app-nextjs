# Phase 5: Testing - Complete Guide

## Overview

This document describes the testing infrastructure for the Recipe Sharing App Next.js migration. We have implemented comprehensive end-to-end (E2E), accessibility, and error handling tests using Playwright and @axe-core/playwright.

## Test Statistics

- **Total Tests**: 49
  - **E2E Tests**: 25 (17 core + 8 error handling)
  - **Accessibility Tests**: 24 (WCAG 2.1 Level AA)
- **Browser Coverage**: Chromium, Firefox, WebKit (desktop only)
- **Target Execution Time**: < 60 seconds
- **Test Timeout**: 45 seconds per test

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests (25 tests)
│   ├── recipes.spec.ts     # Recipe CRUD flows (5 tests)
│   ├── blog.spec.ts        # Blog CRUD flows (3 tests)
│   ├── navigation.spec.ts  # Navigation & search (4 tests)
│   ├── interactions.spec.ts # User interactions (5 tests)
│   └── error-handling.spec.ts # Error scenarios (8 tests)
├── accessibility/          # WCAG AA tests (24 tests)
│   ├── recipes-a11y.spec.ts    # Recipe accessibility (10 tests)
│   ├── blog-a11y.spec.ts       # Blog accessibility (8 tests)
│   └── navigation-a11y.spec.ts # Navigation accessibility (6 tests)
├── fixtures/               # Test utilities & data
│   ├── accessibility.ts    # A11y helper functions
│   ├── mocks.ts           # API mocking utilities
│   ├── test-data.ts       # Test data factories
│   ├── sample-recipe.jpg  # Test image fixture
│   ├── sample-blog.jpg    # Test image fixture
│   └── sample-audio.webm  # Test audio fixture
└── helpers/               # Shared test helpers (future)
```

## Running Tests

### Prerequisites

1. **Test Data**: Seed your Supabase database with test data (see TEST_DATA_SETUP.sql)
2. **Environment**: Ensure `.env.local` has valid Supabase credentials
3. **Dev Server**: Tests run against `http://localhost:3000`

### Commands

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run specific test suite
npm run test:e2e
npm run test:accessibility
npm run test:headed        # Run with browser UI visible
npm run test:debug         # Run in debug mode

# Run specific test file
npx playwright test tests/e2e/recipes.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Test Workflow

1. **Start dev server**: `npm run dev` (in separate terminal)
2. **Wait for server**: Ensure http://localhost:3000 is responding
3. **Run tests**: `npm test`
4. **View report**: `npx playwright show-report` (if tests fail)

## Test Coverage

### E2E Tests (25 tests)

#### Recipes (5 tests)
- ✅ Recipe list page loads
- ✅ Recipe creation page loads
- ✅ Recipe detail page loads
- ✅ Recipe filters work
- ✅ Recipe search works

#### Blog (3 tests)
- ✅ Blog list page loads
- ✅ Blog creation page loads
- ✅ Blog detail page loads

#### Navigation (4 tests)
- ✅ Home page loads
- ✅ Navigation links work
- ✅ Recipe page has filters
- ✅ Blog page has filters

#### Interactions (5 tests)
- ✅ Recipe detail shows content
- ✅ Blog detail shows content
- ✅ Recipe forms are accessible
- ✅ Recipe likes work
- ✅ Comment section exists

#### Error Handling (8 tests)
- ✅ Empty state handling (recipes, blog)
- ✅ 404 handling (non-existent IDs)
- ✅ Form validation errors
- ✅ Invalid route navigation
- ✅ Special character sanitization (XSS prevention)
- ✅ Missing file upload handling

### Accessibility Tests (24 tests)

#### Recipes Accessibility (10 tests)
- ✅ No WCAG violations on list page
- ✅ Proper heading hierarchy
- ✅ Landmark regions present
- ✅ Sufficient color contrast
- ✅ Form labels present
- ✅ Keyboard navigation support
- ✅ Recipe cards have ARIA attributes
- ✅ Detail page accessibility
- ✅ Form accessibility
- ✅ Focus management

#### Blog Accessibility (8 tests)
- ✅ No WCAG violations on list page
- ✅ Proper heading hierarchy
- ✅ Landmark regions present
- ✅ Form labels present
- ✅ Keyboard navigation support
- ✅ Detail page accessibility
- ✅ Form accessibility
- ✅ Focus management

#### Navigation Accessibility (6 tests)
- ✅ No WCAG violations on home page
- ✅ Landmark regions present
- ✅ Keyboard navigation support
- ✅ Focus management during navigation
- ✅ Interactive elements keyboard accessible
- ✅ Proper heading hierarchy

## Test Utilities

### Accessibility Helpers (`tests/fixtures/accessibility.ts`)

```typescript
// Run axe accessibility scan
await checkAccessibility(page, 'Recipe Detail Page');

// Check keyboard navigation
const isNavigable = await checkKeyboardNavigation(page, 'input[name="title"]');

// Check color contrast
const hasGoodContrast = await checkColorContrast(page);

// Check form labels
const hasLabels = await checkFormLabels(page);

// Check heading hierarchy
const isValid = await checkHeadingHierarchy(page);

// Check focus management
const hasFocus = await checkFocusManagement(page);
```

### API Mocking (`tests/fixtures/mocks.ts`)

```typescript
// Mock API errors
const apiMock = new ApiMock(page);
await apiMock.mockError('/api/recipes', 500);

// Mock empty responses
await apiMock.mockEmpty('/api/recipes');

// Mock slow responses
await apiMock.mockSlow('/api/recipes', 3000);

// Create mock data
const mockRecipe = createMockRecipe({ title: 'Test Recipe' });
const mockBlogPost = createMockBlogPost({ published: true });
```

## Known Limitations

1. **Test Data**: Tests use real Supabase database, not isolated test DB
   - Manual data seeding required (see TEST_DATA_SETUP.sql)
   - Tests assume certain data exists (e.g., at least 1 recipe, 1 blog post)

2. **User Authentication**: Tests use mock user ID (`MOCK_USER_ID = 1`)
   - Corresponds to `guest_user` in database
   - No real authentication flow tested

3. **Visual Regression**: Not implemented (may add in Phase 6)

4. **Mobile Testing**: Desktop browsers only (responsive design not tested)

5. **Performance Testing**: Not included (may add later)

## CI/CD Integration (Future)

When adding to CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Start dev server
  run: npm run dev &
  
- name: Wait for server
  run: npx wait-on http://localhost:3000

- name: Run tests
  run: npm test

- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Tests Failing Due to Missing Data

**Problem**: Tests expect certain data to exist (recipes, blog posts)

**Solution**: Run the SQL script to seed test data
```bash
psql -h <supabase-host> -U postgres -d postgres -f tests/fixtures/TEST_DATA_SETUP.sql
```

### Tests Timing Out

**Problem**: Tests exceed 45-second timeout

**Solution**: Check if dev server is slow or database connection is slow
- Increase timeout in `playwright.config.ts` if needed
- Optimize API route handlers
- Check Supabase database performance

### Accessibility Violations

**Problem**: axe-core reports WCAG violations

**Solution**: Review violations in test output
```bash
npx playwright test tests/accessibility/ --reporter=list
```
Fix violations in components, then re-run tests

### Flaky Tests

**Problem**: Tests pass sometimes, fail other times

**Solution**: 
- Increase `waitForTimeout` values for Next.js SSR hydration
- Use `waitForLoadState('networkidle')` before assertions
- Check for race conditions in API calls

## Next Steps (Phase 6)

Potential testing enhancements:
- [ ] Visual regression testing (Percy, Chromatic)
- [ ] Performance testing (Lighthouse CI)
- [ ] Mobile browser testing
- [ ] Integration with CI/CD (GitHub Actions)
- [ ] Test data isolation (separate test database)
- [ ] Real authentication flow testing

---

**Last Updated**: Phase 5 completion  
**Maintained By**: Migration Team  
**Questions**: See main project README or create GitHub issue
