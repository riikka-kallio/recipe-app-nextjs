# Supabase Setup Guide for Recipe App Migration

This guide walks you through setting up your Supabase project for the Recipe App Next.js migration.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up or log in
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: `recipe-app-production` (or your preferred name)
   - **Database Password**: Create a strong password (you won't need this often, but save it)
   - **Region**: Choose the region closest to your users (e.g., US East for US-based users)
   - **Pricing Plan**: Free tier (can upgrade later if needed)
4. Click **"Create new project"** and wait for it to finish initializing (2-3 minutes)

## Step 2: Get Your Supabase Credentials

Once your project is created:

1. Go to **Project Settings** (gear icon in the left sidebar)
2. Click **API** tab
3. You'll see three important values:
   - **Project URL**: Copy this value
   - **anon public key**: Copy this value
   - **service_role key**: Copy this value (keep it SECRET)

4. Update your `.env.local` file in `/recipe-app-nextjs/` with these values:

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## Step 3: Run the Database Schema

1. In your Supabase project dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `/Users/riikkakallio/projects/reciepe-app/database/combined_schema.sql` in a text editor
4. Copy the entire contents
5. Paste it into the Supabase SQL Editor query box
6. Click **Run** (or press Cmd+Enter on Mac, Ctrl+Enter on Windows)
7. Wait for the query to complete (you should see a success message)

You can verify the tables were created by going to the **Table Editor** in Supabase - you should see all 13 tables listed:
- users
- recipes
- ingredients
- instructions
- tags
- recipe_tags
- likes
- blog_categories
- blog_posts
- blog_post_categories
- blog_post_recipes
- blog_post_likes
- blog_post_media

## Step 4: Create Storage Buckets

Storage buckets are where we'll store images and audio files.

1. In your Supabase project, click **Storage** (left sidebar)
2. Click **Create a new bucket**
3. Create first bucket:
   - **Bucket name**: `recipe-images`
   - **Public bucket**: Toggle ON (so files are publicly accessible)
   - Click **Create**

4. Create second bucket:
   - **Bucket name**: `blog-media`
   - **Public bucket**: Toggle ON
   - Click **Create**

## Step 5: Verify Your Setup

To test that everything is connected properly:

1. Make sure your `.env.local` file in `/recipe-app-nextjs/` has all three values filled in
2. Run the Next.js development server:
   ```bash
   cd /Users/riikkakallio/projects/recipe-app-nextjs
   npm run dev
   ```
3. Open http://localhost:3000 in your browser
4. You should see the Next.js default page (no errors in the console)

## Troubleshooting

**Error: "Cannot find module '@supabase/supabase-js'"**
- Run `npm install` in the recipe-app-nextjs directory

**Error: "Invalid API key"**
- Double-check your NEXT_PUBLIC_SUPABASE_ANON_KEY value
- Make sure there are no extra spaces or quotes

**Error: "Relation 'public.users' does not exist"**
- The database schema didn't run properly
- Try running the combined_schema.sql again

**Storage buckets not accessible**
- Make sure you toggled the "Public bucket" option ON for both buckets
- The buckets should show a "public" label in the Storage list

## What's Next?

Once your Supabase project is set up and the Next.js development server is running:

1. **Phase 2** will copy UI components and utilities
2. **Phase 3** will migrate API routes
3. **Phase 4** will migrate frontend pages
4. **Phase 5** will test with Playwright
5. **Phase 6** will deploy to Vercel

For any issues during this process, check the browser console and terminal for error messages.
