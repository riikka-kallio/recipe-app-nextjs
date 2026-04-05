# RLS Implementation Guide

## ✅ What's Been Created

I've generated the RLS policies SQL file at:
```
/Users/riikkakallio/projects/reciepe-app/database/rls_policies.sql
```

This file contains:
- RLS enabled on all 13 tables
- 45 security policies (SELECT, INSERT, UPDATE, DELETE)
- JWT-based auth ready for Phase 7
- Mock userId=1 support for development

---

## 🚀 Your Action Items (15 minutes)

### Step 1: Open the SQL File
```bash
cat /Users/riikkakallio/projects/reciepe-app/database/rls_policies.sql
```
Or open it in your text editor to review the policies.

### Step 2: Run in Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query** button
4. Copy the entire contents of `/database/rls_policies.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd+Enter on Mac, Ctrl+Enter on Windows)
7. Wait for execution to complete

**Expected result:**
```
Success. No rows returned
```

### Step 3: Verify RLS is Enabled
1. In Supabase, click **Authentication** → **Policies** in the left sidebar
2. You should see all 13 tables listed with RLS enabled
3. Click on any table (e.g., "recipes") to see its policies
4. You should see policies like:
   - `recipes_select`
   - `recipes_insert`
   - `recipes_update`
   - `recipes_delete`

### Step 4: Verify Security Warning is Gone
1. Go to **Project Settings** or check the dashboard
2. The "RLS not enabled" warning should be **GONE** ✅
3. If you still see warnings, refresh the page

### Step 5: Test RLS (Optional - Quick Test)
1. In SQL Editor, try this test query:
```sql
-- This should work (public read)
SELECT * FROM recipes LIMIT 5;

-- This should work (public read)
SELECT * FROM tags;
```

If both queries return results without errors, RLS is working! ✅

---

## 🔐 How RLS Works Now

### Public Read Access
Anyone can view:
- ✅ All recipes
- ✅ All ingredients and instructions
- ✅ Published blog posts
- ✅ Tags and categories
- ✅ Likes count

### User-Owned Write Access
Users can only:
- ✅ Create their own recipes/blog posts
- ✅ Edit their own recipes/blog posts
- ✅ Delete their own recipes/blog posts
- ✅ Add/remove ingredients/instructions to their own recipes
- ✅ Like/unlike as themselves

### How auth.uid() Works

**Now (Phase 2-6):**
```typescript
// In API routes (Phase 3), we'll mock it:
const userId = 1
// RLS validates: auth.uid()::int = 1
```

**Phase 7 (Real Auth):**
```typescript
// In API routes, get real user from JWT:
const { data: { user } } = await supabase.auth.getUser()
const userId = user.id
// RLS validates: auth.uid()::int = actual user id from JWT
```

**The beauty:** RLS policies don't change! They already expect `auth.uid()` from JWT.

---

## 📦 Storage Buckets (Plan A)

As confirmed, storage buckets remain **public** with API-side validation:

### Current Setup
- **recipe-images**: Public read/write ✅
- **blog-media**: Public read/write ✅

### Security Strategy
- **Phase 2-6**: API routes validate before upload
- **Phase 7**: Can optionally add storage RLS policies

### Why This Works
```
User uploads image
  ↓
API route: "Is userId = 1?" ✅ Yes
  ↓
Upload to public bucket
  ↓
Success ✅
```

If userId ≠ 1, API blocks before upload reaches bucket.

---

## 🧪 Testing in Phase 3 (API Routes)

When we create API routes, each will include:

```typescript
// Example: app/api/recipes/route.ts
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  // For Phase 2-6: Mock user
  // TODO Phase 7: Get real user from JWT
  const userId = 1
  
  // Query with RLS automatically applied
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
  
  // RLS ensures only appropriate data is returned
  return Response.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const userId = 1 // Mock
  
  const body = await request.json()
  
  // RLS validates user_id matches auth.uid()
  const { data, error } = await supabase
    .from('recipes')
    .insert({ ...body, user_id: userId })
  
  if (error) return Response.json({ error }, { status: 400 })
  return Response.json(data)
}
```

---

## 🔍 Troubleshooting

### Error: "new row violates row-level security policy"
**Cause**: Trying to insert/update with userId that doesn't match auth.uid()
**Fix**: Ensure `user_id` in data matches the authenticated user (1 for now)

### Error: "permission denied for table X"
**Cause**: RLS policy doesn't exist or is too restrictive
**Fix**: Verify policy was created in Supabase → Authentication → Policies

### Warning still shows in Supabase
**Cause**: Page cache
**Fix**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Can't read any data
**Cause**: SELECT policy too restrictive
**Fix**: Check that public read policies exist (e.g., `recipes_select`)

---

## ✅ Checklist

Before proceeding to Phase 2, confirm:

- [ ] Opened `/database/rls_policies.sql` and reviewed contents
- [ ] Ran SQL in Supabase SQL Editor
- [ ] Saw "Success" message (no errors)
- [ ] Verified RLS enabled on all 13 tables in Supabase dashboard
- [ ] Verified 45 policies created (check Authentication → Policies)
- [ ] Security warning about RLS is gone
- [ ] Optional: Ran test queries successfully

---

## ⏭️ Next: Phase 2

Once you confirm RLS is working:

**Reply with:** "RLS enabled and verified" or "RLS complete"

**I will then start Phase 2:**
- Copy 7 UI components
- Copy 5 custom hooks
- Copy type definitions
- Set up TipTap editor
- Configure React Query
- Create app layout and providers

**Estimated time for Phase 2:** 2-3 hours

---

## 🆘 Need Help?

If you encounter any errors while running the SQL:
1. Copy the exact error message
2. Share it with me
3. I'll help debug and fix the issue

Otherwise, proceed with the steps above and let me know when RLS is verified! 🚀
