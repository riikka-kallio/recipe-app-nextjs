# UUID Migration & RLS Setup Guide

## 🎯 What Happened

You encountered: `ERROR: cannot cast type uuid to integer`

**Root cause:** Supabase Auth uses UUID for user IDs, but our schema used INTEGER.

**Solution:** Migrate to UUID schema + updated RLS policies (no casting needed)

---

## ✅ Files Created

1. **`/database/convert_to_uuid.sql`** - Migrates INTEGER to UUID
2. **`/database/rls_policies_uuid.sql`** - RLS policies for UUID (fixed)

---

## 🚀 Step-by-Step Instructions (20 minutes)

### Step 1: Run UUID Migration

**File:** `/Users/riikkakallio/projects/reciepe-app/database/convert_to_uuid.sql`

**What it does:**
- Converts `users.id` from INTEGER to UUID
- Converts all `user_id` columns to UUID in related tables
- Recreates foreign key constraints
- Creates mock user with UUID: `550e8400-e29b-41d4-a716-446655440000`

**Instructions:**
1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy entire contents of `/database/convert_to_uuid.sql`
4. Paste into editor
5. Click **Run**
6. Wait for success message

**Expected result:**
```
Success. No rows returned
```

⚠️ **WARNING:** This will delete existing data (users, recipes, blog posts). That's OK for development - we'll re-seed later.

---

### Step 2: Run UUID RLS Policies

**File:** `/Users/riikkakallio/projects/reciepe-app/database/rls_policies_uuid.sql`

**What it does:**
- Enables RLS on all 13 tables
- Creates 45 policies using `auth.uid()` (UUID) - NO CASTING
- Public read, user-owned write policies

**Instructions:**
1. In Supabase SQL Editor, click **New Query** again
2. Copy entire contents of `/database/rls_policies_uuid.sql`
3. Paste into editor
4. Click **Run**
5. Wait for success message

**Expected result:**
```
Success. No rows returned
```

---

### Step 3: Verify Setup

**Check RLS enabled:**
1. Go to **Authentication** → **Policies**
2. Verify all 13 tables listed
3. Verify 45 policies created (3-5 per table)

**Check security warning:**
1. Refresh Supabase dashboard
2. Security warning about RLS should be **GONE** ✅

**Test queries:**
```sql
-- Should work (public read)
SELECT * FROM users;

-- Should return the mock user
SELECT * FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Should work (public read)
SELECT * FROM tags;
```

---

## 🔑 Mock User UUID for Testing

**Development UUID (Phase 2-6):**
```
550e8400-e29b-41d4-a716-446655440000
```

**How to use in API routes:**
```typescript
// Phase 2-6: Mock UUID
const userId = '550e8400-e29b-41d4-a716-446655440000'

// Phase 7: Real auth
const { data: { user } } = await supabase.auth.getUser()
const userId = user.id // Returns UUID from JWT
```

---

## 📝 What Changed

### Before (INTEGER)
```typescript
// Database schema
user_id INTEGER

// RLS policy
auth.uid()::int = user_id  ❌ ERROR: cannot cast uuid to int

// Mock testing
const userId = 1
```

### After (UUID)
```typescript
// Database schema
user_id UUID

// RLS policy
auth.uid() = user_id  ✅ Works! Both are UUID

// Mock testing
const userId = '550e8400-e29b-41d4-a716-446655440000'
```

---

## 🧪 Testing Strategy

### Phase 2-6 (Development)
All API requests use mock UUID:
```typescript
const userId = '550e8400-e29b-41d4-a716-446655440000'
```

RLS validates:
```
Request: Create recipe with user_id = '550e8400...'
  ↓
RLS: auth.uid() = '550e8400...'
  ↓
Match? ✅ Yes → Allow
```

### Phase 7 (Real Auth)
Switch to real JWT user:
```typescript
const { data: { user } } = await supabase.auth.getUser()
const userId = user.id // Real UUID from Supabase Auth
```

RLS validates:
```
Request: Create recipe with user_id = <real-uuid>
  ↓
RLS: auth.uid() = <real-uuid>
  ↓
Match? ✅ Yes → Allow
```

---

## 🔍 Troubleshooting

### Error: "column does not exist"
**Cause:** UUID migration didn't complete
**Fix:** Re-run `/database/convert_to_uuid.sql`

### Error: "policy already exists"
**Cause:** Policies from first attempt still exist
**Fix:** Drop old policies first:
```sql
-- Run this before rls_policies_uuid.sql
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_update_own ON users;
-- (repeat for all policies, or just recreate database)
```

### No users in database
**Cause:** UUID migration deleted old data
**Fix:** Expected! The mock user is created with UUID:
```sql
SELECT * FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

### RLS policies still show old integer casting
**Cause:** Old policies not replaced
**Fix:** Drop all policies and re-run `rls_policies_uuid.sql`

---

## ✅ Success Criteria

After completing both steps, you should have:

- [ ] UUID migration ran successfully
- [ ] RLS policies created successfully
- [ ] No "cannot cast uuid to integer" errors
- [ ] All 13 tables show RLS enabled in dashboard
- [ ] 45 policies visible in Authentication → Policies
- [ ] Security warning about RLS is GONE
- [ ] Test queries return results without errors
- [ ] Mock user exists with UUID `550e8400...`

---

## ⏭️ Next Steps

Once you confirm both SQL files ran successfully:

**Reply with:** "UUID migration complete" or "RLS working with UUID"

**Then I'll proceed to Phase 2:**
- Copy UI components
- Copy hooks
- Set up TipTap editor
- Configure React Query
- Create app layout

All code will use the mock UUID: `550e8400-e29b-41d4-a716-446655440000`

---

## 📋 Quick Checklist

1. [ ] Run `/database/convert_to_uuid.sql` in Supabase SQL Editor
2. [ ] Verify: "Success. No rows returned"
3. [ ] Run `/database/rls_policies_uuid.sql` in Supabase SQL Editor
4. [ ] Verify: "Success. No rows returned"
5. [ ] Check: Authentication → Policies shows all 13 tables
6. [ ] Check: Security warning is gone
7. [ ] Test: `SELECT * FROM users;` returns mock user
8. [ ] Reply: "UUID migration complete"

Ready when you are! 🚀
