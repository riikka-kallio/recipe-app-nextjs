# Phase 4 Schema Fixes - Instructions

## Issue Summary
After Phase 4 implementation, the API routes are returning 500 errors due to schema mismatches between the database and API expectations.

## Root Causes Identified

### 1. Table Name Mismatches
- **Recipe Likes**: Database has `likes` table, API routes expected `recipe_likes`
- **Blog Categories**: Database has `blog_categories` table, API routes expected `categories`

### 2. User ID Type Mismatch
- **Database schema**: Uses `INTEGER` for user_id columns (SERIAL PRIMARY KEY)
- **Mock authentication**: Was using UUID string `'550e8400-e29b-41d4-a716-446655440000'`
- **Fix**: Changed mock user ID to INTEGER `1` (matches `guest_user` from seed data)

### 3. Missing Column
- **Instructions table**: Missing `audio_url` column needed for audio recording feature

## Fixes Applied

### ✅ Code Changes (Completed)

1. **Updated `lib/apiHelpers.ts`**
   - Changed `MOCK_USER_ID` from UUID string to INTEGER `1`
   - Updated `getUserIdFromRequest()` return type to `number`

2. **Fixed Recipe API Routes**
   - `app/api/recipes/trending/route.ts` - Changed `recipe_likes` → `likes`
   - `app/api/recipes/route.ts` - Changed `recipe_likes` → `likes`
   - `app/api/recipes/[id]/route.ts` - Changed `recipe_likes` → `likes`
   - `app/api/recipes/[id]/like/route.ts` - Changed `recipe_likes` → `likes`

3. **Fixed Blog API Routes**
   - `app/api/blog/route.ts` - Changed `categories` → `blog_categories`
   - `app/api/blog/[id]/route.ts` - Changed `categories` → `blog_categories`
   - `app/api/categories/route.ts` - Changed `categories` → `blog_categories`
   - `app/api/categories/[id]/route.ts` - Changed `categories` → `blog_categories`

4. **Removed Explicit Foreign Key Hints**
   - Removed hints like `!recipes_user_id_fkey` and `!blog_post_categories_category_id_fkey`
   - Let Supabase auto-detect foreign key relationships
   - Simplified join syntax to just table names (e.g., `user:users` instead of `user:users!recipes_user_id_fkey`)

### 🔧 Database Migration Required (Action Needed)

**File Created**: `database/migration_add_audio_url.sql`

You need to run this SQL in your Supabase SQL Editor:

```sql
-- Add audio_url column to instructions table
ALTER TABLE instructions 
  ADD COLUMN IF NOT EXISTS audio_url VARCHAR(500);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_instructions_audio_url 
  ON instructions(audio_url) 
  WHERE audio_url IS NOT NULL;

-- Add documentation comment
COMMENT ON COLUMN instructions.audio_url IS 'URL to audio recording stored in Supabase Storage (optional)';
```

**Steps to Apply:**
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to: SQL Editor > New Query
3. Copy the contents of `database/migration_add_audio_url.sql`
4. Paste and click "Run"
5. Verify success message appears

## Testing After Migration

Once you've run the SQL migration, test these endpoints:

### 1. Test Trending Recipes
```bash
curl http://localhost:3001/api/recipes/trending?page=1&limit=20
```

**Expected**: `{"success": true, "data": [...], "pagination": {...}}`

### 2. Test Blog Posts
```bash
curl http://localhost:3001/api/blog?published=true
```

**Expected**: `{"success": true, "data": [...], "pagination": {...}}`

### 3. Test HomePage
Open http://localhost:3001 in your browser

**Expected**: 
- HomePage loads without errors
- Trending recipes section displays (may be empty if no data)
- Recent blog posts section displays (may be empty if no data)
- No console errors about failed API calls

## Additional Notes

### Why These Changes Were Needed

1. **Foreign Key Hints**: Supabase PostgREST auto-detects foreign keys based on actual database schema. Explicit hints like `!recipes_user_id_fkey` are only needed when there are multiple foreign keys between the same tables. For our schema, auto-detection works fine.

2. **User ID Type**: The original Express backend likely used auto-incrementing INTEGER IDs. When migrating to Supabase, we kept the same schema structure but need to ensure mock data matches the type.

3. **Audio Recording**: Phase 4 added the RecipeForm with audio recording support, but the original schema didn't include this field. This migration adds it retroactively.

### Schema Verification

If you want to verify your current schema matches expectations:

**Expected Tables (13 total):**
1. users (INTEGER id)
2. recipes (INTEGER id, user_id)
3. ingredients (INTEGER id, recipe_id, is_garnish, audio_url - AFTER MIGRATION)
4. instructions (INTEGER id, recipe_id)
5. tags (INTEGER id)
6. recipe_tags (recipe_id, tag_id)
7. **likes** (INTEGER id, user_id, recipe_id) ← NOT recipe_likes
8. **blog_categories** (INTEGER id) ← NOT categories
9. blog_posts (INTEGER id, user_id)
10. blog_post_categories (blog_post_id, category_id)
11. blog_post_recipes (INTEGER id, blog_post_id, recipe_id)
12. blog_post_likes (INTEGER id, user_id, blog_post_id)
13. blog_post_media (INTEGER id, blog_post_id)

## What's Next

After you run the migration and verify the endpoints work:

1. Test the full application flow (create recipe, add blog post, etc.)
2. Verify audio recording works in recipe instructions
3. Test cooking mode with audio playback
4. Check that all CRUD operations work correctly

## Rollback (If Needed)

If something goes wrong with the audio_url migration:

```sql
-- Remove the audio_url column
ALTER TABLE instructions DROP COLUMN IF EXISTS audio_url;

-- Remove the index
DROP INDEX IF EXISTS idx_instructions_audio_url;
```

---

**Status**: Awaiting database migration execution
**Estimated Time**: 2 minutes to run SQL
**Risk Level**: Low (additive change, won't break existing data)
