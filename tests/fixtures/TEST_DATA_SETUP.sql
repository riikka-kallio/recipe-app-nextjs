-- TEST DATA SETUP SCRIPT
-- Recipe Sharing App - Playwright E2E & Accessibility Tests
--
-- This script sets up the minimum required test data for running Playwright tests.
-- Run this against your Supabase database before running tests.
--
-- IMPORTANT: This script is IDEMPOTENT - safe to run multiple times
-- It will NOT create duplicate data if test data already exists.
--
-- Usage:
--   psql -h <supabase-host> -U postgres -d postgres -f tests/fixtures/TEST_DATA_SETUP.sql
--
-- Or via Supabase SQL Editor:
--   Copy and paste this entire file into the SQL Editor and run

-- ============================================================================
-- 1. ENSURE TEST USER EXISTS (guest_user with ID=1)
-- ============================================================================

-- Check if guest_user exists, insert if not
INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
SELECT 
  1,
  'guest_user',
  'guest@example.com',
  '$2a$10$dummyhashforguest.user.testing.purposes.only',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE id = 1
);

-- Reset sequence if needed (in case ID=1 was manually created)
SELECT setval('users_id_seq', GREATEST((SELECT MAX(id) FROM users), 1));

-- ============================================================================
-- 2. CREATE TEST TAGS (if not exist)
-- ============================================================================

-- Insert test tags if they don't exist
INSERT INTO tags (name, created_at, updated_at)
SELECT 'Breakfast', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Breakfast');

INSERT INTO tags (name, created_at, updated_at)
SELECT 'Lunch', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Lunch');

INSERT INTO tags (name, created_at, updated_at)
SELECT 'Dinner', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Dinner');

INSERT INTO tags (name, created_at, updated_at)
SELECT 'Dessert', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Dessert');

INSERT INTO tags (name, created_at, updated_at)
SELECT 'Vegetarian', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Vegetarian');

INSERT INTO tags (name, created_at, updated_at)
SELECT 'Vegan', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Vegan');

-- ============================================================================
-- 3. CREATE TEST CATEGORIES (for blog posts)
-- ============================================================================

INSERT INTO categories (name, created_at, updated_at)
SELECT 'Cooking Tips', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Cooking Tips');

INSERT INTO categories (name, created_at, updated_at)
SELECT 'Food Culture', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Food Culture');

INSERT INTO categories (name, created_at, updated_at)
SELECT 'Kitchen Essentials', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Kitchen Essentials');

-- ============================================================================
-- 4. CREATE TEST RECIPES (minimum 3 recipes for testing)
-- ============================================================================

-- Recipe 1: Test Pancakes
INSERT INTO recipes (
  user_id, title, description, difficulty, 
  prep_time, cook_time, servings, 
  image_url, created_at, updated_at
)
SELECT 
  1,
  'Test Recipe: Fluffy Pancakes',
  'Delicious fluffy pancakes perfect for breakfast testing',
  'easy',
  10,
  15,
  4,
  'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM recipes WHERE title = 'Test Recipe: Fluffy Pancakes'
);

-- Recipe 2: Test Pasta
INSERT INTO recipes (
  user_id, title, description, difficulty, 
  prep_time, cook_time, servings, 
  image_url, created_at, updated_at
)
SELECT 
  1,
  'Test Recipe: Classic Spaghetti Carbonara',
  'Italian pasta dish for testing purposes',
  'medium',
  15,
  20,
  2,
  'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM recipes WHERE title = 'Test Recipe: Classic Spaghetti Carbonara'
);

-- Recipe 3: Test Salad
INSERT INTO recipes (
  user_id, title, description, difficulty, 
  prep_time, cook_time, servings, 
  image_url, created_at, updated_at
)
SELECT 
  1,
  'Test Recipe: Fresh Garden Salad',
  'Healthy salad for accessibility testing',
  'easy',
  10,
  0,
  4,
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM recipes WHERE title = 'Test Recipe: Fresh Garden Salad'
);

-- ============================================================================
-- 5. ADD INGREDIENTS TO TEST RECIPES
-- ============================================================================

-- Get recipe IDs for our test recipes
DO $$
DECLARE
  pancake_id INTEGER;
  pasta_id INTEGER;
  salad_id INTEGER;
BEGIN
  -- Get recipe IDs
  SELECT id INTO pancake_id FROM recipes WHERE title = 'Test Recipe: Fluffy Pancakes' LIMIT 1;
  SELECT id INTO pasta_id FROM recipes WHERE title = 'Test Recipe: Classic Spaghetti Carbonara' LIMIT 1;
  SELECT id INTO salad_id FROM recipes WHERE title = 'Test Recipe: Fresh Garden Salad' LIMIT 1;

  -- Pancake ingredients
  IF pancake_id IS NOT NULL THEN
    INSERT INTO ingredients (recipe_id, item, quantity, unit, step_number)
    SELECT pancake_id, 'Flour', '2', 'cups', 1
    WHERE NOT EXISTS (SELECT 1 FROM ingredients WHERE recipe_id = pancake_id AND item = 'Flour');
    
    INSERT INTO ingredients (recipe_id, item, quantity, unit, step_number)
    SELECT pancake_id, 'Milk', '1.5', 'cups', 2
    WHERE NOT EXISTS (SELECT 1 FROM ingredients WHERE recipe_id = pancake_id AND item = 'Milk');
    
    INSERT INTO ingredients (recipe_id, item, quantity, unit, step_number)
    SELECT pancake_id, 'Eggs', '2', 'large', 3
    WHERE NOT EXISTS (SELECT 1 FROM ingredients WHERE recipe_id = pancake_id AND item = 'Eggs');
  END IF;

  -- Pasta ingredients
  IF pasta_id IS NOT NULL THEN
    INSERT INTO ingredients (recipe_id, item, quantity, unit, step_number)
    SELECT pasta_id, 'Spaghetti', '400', 'g', 1
    WHERE NOT EXISTS (SELECT 1 FROM ingredients WHERE recipe_id = pasta_id AND item = 'Spaghetti');
    
    INSERT INTO ingredients (recipe_id, item, quantity, unit, step_number)
    SELECT pasta_id, 'Eggs', '3', 'large', 2
    WHERE NOT EXISTS (SELECT 1 FROM ingredients WHERE recipe_id = pasta_id AND item = 'Eggs');
    
    INSERT INTO ingredients (recipe_id, item, quantity, unit, step_number)
    SELECT pasta_id, 'Parmesan', '100', 'g', 3
    WHERE NOT EXISTS (SELECT 1 FROM ingredients WHERE recipe_id = pasta_id AND item = 'Parmesan');
  END IF;

  -- Salad ingredients
  IF salad_id IS NOT NULL THEN
    INSERT INTO ingredients (recipe_id, item, quantity, unit, step_number)
    SELECT salad_id, 'Lettuce', '1', 'head', 1
    WHERE NOT EXISTS (SELECT 1 FROM ingredients WHERE recipe_id = salad_id AND item = 'Lettuce');
    
    INSERT INTO ingredients (recipe_id, item, quantity, unit, step_number)
    SELECT salad_id, 'Tomatoes', '2', 'medium', 2
    WHERE NOT EXISTS (SELECT 1 FROM ingredients WHERE recipe_id = salad_id AND item = 'Tomatoes');
  END IF;
END $$;

-- ============================================================================
-- 6. ADD INSTRUCTIONS TO TEST RECIPES
-- ============================================================================

DO $$
DECLARE
  pancake_id INTEGER;
  pasta_id INTEGER;
  salad_id INTEGER;
BEGIN
  -- Get recipe IDs
  SELECT id INTO pancake_id FROM recipes WHERE title = 'Test Recipe: Fluffy Pancakes' LIMIT 1;
  SELECT id INTO pasta_id FROM recipes WHERE title = 'Test Recipe: Classic Spaghetti Carbonara' LIMIT 1;
  SELECT id INTO salad_id FROM recipes WHERE title = 'Test Recipe: Fresh Garden Salad' LIMIT 1;

  -- Pancake instructions
  IF pancake_id IS NOT NULL THEN
    INSERT INTO instructions (recipe_id, step_number, instruction)
    SELECT pancake_id, 1, 'Mix dry ingredients in a large bowl'
    WHERE NOT EXISTS (SELECT 1 FROM instructions WHERE recipe_id = pancake_id AND step_number = 1);
    
    INSERT INTO instructions (recipe_id, step_number, instruction)
    SELECT pancake_id, 2, 'Whisk wet ingredients separately, then combine with dry'
    WHERE NOT EXISTS (SELECT 1 FROM instructions WHERE recipe_id = pancake_id AND step_number = 2);
    
    INSERT INTO instructions (recipe_id, step_number, instruction)
    SELECT pancake_id, 3, 'Cook on medium heat until bubbles form, then flip'
    WHERE NOT EXISTS (SELECT 1 FROM instructions WHERE recipe_id = pancake_id AND step_number = 3);
  END IF;

  -- Pasta instructions
  IF pasta_id IS NOT NULL THEN
    INSERT INTO instructions (recipe_id, step_number, instruction)
    SELECT pasta_id, 1, 'Cook spaghetti according to package directions'
    WHERE NOT EXISTS (SELECT 1 FROM instructions WHERE recipe_id = pasta_id AND step_number = 1);
    
    INSERT INTO instructions (recipe_id, step_number, instruction)
    SELECT pasta_id, 2, 'Beat eggs with parmesan cheese'
    WHERE NOT EXISTS (SELECT 1 FROM instructions WHERE recipe_id = pasta_id AND step_number = 2);
    
    INSERT INTO instructions (recipe_id, step_number, instruction)
    SELECT pasta_id, 3, 'Toss hot pasta with egg mixture off heat'
    WHERE NOT EXISTS (SELECT 1 FROM instructions WHERE recipe_id = pasta_id AND step_number = 3);
  END IF;

  -- Salad instructions
  IF salad_id IS NOT NULL THEN
    INSERT INTO instructions (recipe_id, step_number, instruction)
    SELECT salad_id, 1, 'Wash and chop lettuce into bite-sized pieces'
    WHERE NOT EXISTS (SELECT 1 FROM instructions WHERE recipe_id = salad_id AND step_number = 1);
    
    INSERT INTO instructions (recipe_id, step_number, instruction)
    SELECT salad_id, 2, 'Dice tomatoes and add to bowl'
    WHERE NOT EXISTS (SELECT 1 FROM instructions WHERE recipe_id = salad_id AND step_number = 2);
    
    INSERT INTO instructions (recipe_id, step_number, instruction)
    SELECT salad_id, 3, 'Toss with your favorite dressing and serve'
    WHERE NOT EXISTS (SELECT 1 FROM instructions WHERE recipe_id = salad_id AND step_number = 3);
  END IF;
END $$;

-- ============================================================================
-- 7. CREATE TEST BLOG POSTS (minimum 2 posts for testing)
-- ============================================================================

-- Blog Post 1
INSERT INTO blog_posts (
  user_id, title, content, excerpt, 
  published, featured_image_url, 
  created_at, updated_at
)
SELECT 
  1,
  'Test Blog: 10 Essential Cooking Tips',
  '<p>This is a test blog post about cooking tips. It contains useful information for testing purposes.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>',
  'Essential cooking tips for beginners and experts alike. Test content.',
  true,
  'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM blog_posts WHERE title = 'Test Blog: 10 Essential Cooking Tips'
);

-- Blog Post 2
INSERT INTO blog_posts (
  user_id, title, content, excerpt, 
  published, featured_image_url, 
  created_at, updated_at
)
SELECT 
  1,
  'Test Blog: The Art of Meal Planning',
  '<p>This test blog post discusses meal planning strategies.</p><p>Perfect for testing blog functionality and accessibility.</p>',
  'Learn how to plan your meals effectively. Test content for E2E testing.',
  true,
  'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM blog_posts WHERE title = 'Test Blog: The Art of Meal Planning'
);

-- ============================================================================
-- 8. LINK BLOG POSTS TO CATEGORIES
-- ============================================================================

DO $$
DECLARE
  blog1_id INTEGER;
  blog2_id INTEGER;
  cat1_id INTEGER;
  cat2_id INTEGER;
BEGIN
  -- Get blog post IDs
  SELECT id INTO blog1_id FROM blog_posts WHERE title = 'Test Blog: 10 Essential Cooking Tips' LIMIT 1;
  SELECT id INTO blog2_id FROM blog_posts WHERE title = 'Test Blog: The Art of Meal Planning' LIMIT 1;
  
  -- Get category IDs
  SELECT id INTO cat1_id FROM categories WHERE name = 'Cooking Tips' LIMIT 1;
  SELECT id INTO cat2_id FROM categories WHERE name = 'Food Culture' LIMIT 1;

  -- Link blog 1 to Cooking Tips
  IF blog1_id IS NOT NULL AND cat1_id IS NOT NULL THEN
    INSERT INTO blog_post_categories (blog_post_id, category_id)
    SELECT blog1_id, cat1_id
    WHERE NOT EXISTS (
      SELECT 1 FROM blog_post_categories 
      WHERE blog_post_id = blog1_id AND category_id = cat1_id
    );
  END IF;

  -- Link blog 2 to Food Culture
  IF blog2_id IS NOT NULL AND cat2_id IS NOT NULL THEN
    INSERT INTO blog_post_categories (blog_post_id, category_id)
    SELECT blog2_id, cat2_id
    WHERE NOT EXISTS (
      SELECT 1 FROM blog_post_categories 
      WHERE blog_post_id = blog2_id AND category_id = cat2_id
    );
  END IF;
END $$;

-- ============================================================================
-- 9. INITIALIZE VIEW COUNTS (if needed)
-- ============================================================================

-- Update view counts to ensure they're not NULL
UPDATE blog_posts SET view_count = 0 WHERE view_count IS NULL;
UPDATE recipes SET view_count = 0 WHERE view_count IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify test data was created successfully
SELECT 'Users' as table_name, COUNT(*) as count FROM users WHERE id = 1
UNION ALL
SELECT 'Tags', COUNT(*) FROM tags
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'Recipes', COUNT(*) FROM recipes WHERE title LIKE 'Test Recipe:%'
UNION ALL
SELECT 'Blog Posts', COUNT(*) FROM blog_posts WHERE title LIKE 'Test Blog:%'
UNION ALL
SELECT 'Ingredients', COUNT(*) FROM ingredients WHERE recipe_id IN (
  SELECT id FROM recipes WHERE title LIKE 'Test Recipe:%'
)
UNION ALL
SELECT 'Instructions', COUNT(*) FROM instructions WHERE recipe_id IN (
  SELECT id FROM recipes WHERE title LIKE 'Test Recipe:%'
);

-- Show created test data IDs
SELECT 'Test Recipe IDs:' as info, id, title FROM recipes WHERE title LIKE 'Test Recipe:%'
UNION ALL
SELECT 'Test Blog IDs:', id, title FROM blog_posts WHERE title LIKE 'Test Blog:%';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- After running this script, you should have:
-- - 1 test user (guest_user with ID=1)
-- - 6 tags (Breakfast, Lunch, Dinner, Dessert, Vegetarian, Vegan)
-- - 3 categories (Cooking Tips, Food Culture, Kitchen Essentials)
-- - 3 test recipes with ingredients and instructions
-- - 2 test blog posts with categories
--
-- This is the MINIMUM data required for Playwright tests to pass.
-- Tests assume:
-- - At least 1 recipe exists (for list/detail tests)
-- - At least 1 blog post exists (for list/detail tests)
-- - guest_user (ID=1) exists (for mock authentication)
--
-- ============================================================================
