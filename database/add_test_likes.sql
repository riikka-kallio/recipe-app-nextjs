-- Quick script to add test likes to existing recipes
-- This makes recipes appear in the trending section

-- Add likes to test recipes to make them appear as trending
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

  -- Add likes to pancake recipe (make it trending with recent likes)
  IF pancake_id IS NOT NULL THEN
    INSERT INTO likes (user_id, recipe_id, created_at)
    SELECT 1, pancake_id, NOW() - INTERVAL '2 days'
    WHERE NOT EXISTS (
      SELECT 1 FROM likes WHERE user_id = 1 AND recipe_id = pancake_id
    );
  END IF;

  -- Add likes to pasta recipe (popular with older likes)
  IF pasta_id IS NOT NULL THEN
    INSERT INTO likes (user_id, recipe_id, created_at)
    SELECT 1, pasta_id, NOW() - INTERVAL '5 days'
    WHERE NOT EXISTS (
      SELECT 1 FROM likes WHERE user_id = 1 AND recipe_id = pasta_id
    );
  END IF;

  -- Add likes to salad recipe (most recent, should be #1 trending)
  IF salad_id IS NOT NULL THEN
    INSERT INTO likes (user_id, recipe_id, created_at)
    SELECT 1, salad_id, NOW() - INTERVAL '1 day'
    WHERE NOT EXISTS (
      SELECT 1 FROM likes WHERE user_id = 1 AND recipe_id = salad_id
    );
  END IF;
END $$;

-- Verify likes were added
SELECT 
  r.title,
  COUNT(l.id) as like_count,
  MAX(l.created_at) as most_recent_like
FROM recipes r
LEFT JOIN likes l ON r.id = l.recipe_id
WHERE r.title LIKE 'Test Recipe:%'
GROUP BY r.id, r.title
ORDER BY most_recent_like DESC;
