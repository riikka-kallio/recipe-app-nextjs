import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createSuccessResponse,
  createErrorResponse,
  getPaginationParams,
  calculatePagination,
  getUserIdFromRequest,
  validateRequiredFields,
  withErrorHandling,
} from '@/lib/apiHelpers';

// TODO: Phase 7 - Replace createAdminClient with proper auth context
// This route currently uses admin client to bypass RLS during MVP phase (Phases 2-6)

/**
 * GET /api/blog
 * Get all blog posts with optional filters and pagination
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = createAdminClient();
  const searchParams = request.nextUrl.searchParams;
  const userId = getUserIdFromRequest(request);

  // Get pagination params
  const { page, limit, offset } = getPaginationParams(searchParams);

  // Get filter params
  const searchQuery = searchParams.get('q');
  const category = searchParams.get('category');
  const filterUserId = searchParams.get('user_id');

  // Build the Supabase query with explicit FK constraints
  let query = supabase
    .from('blog_posts')
    .select(
      `
      *,
      user:users!blog_posts_user_id_fkey (
        id,
        username,
        full_name,
        avatar_url
      ),
      categories:blog_post_categories!blog_post_categories_blog_post_id_fkey (
        category:blog_categories!blog_post_categories_category_id_fkey (
          id,
          name,
          slug
        )
      ),
      blog_post_recipes!blog_post_recipes_blog_post_id_fkey (
        recipes!blog_post_recipes_recipe_id_fkey (
          id,
          title,
          description,
          image_url,
          prep_time,
          cook_time,
          servings,
          difficulty
        )
      ),
      blog_post_likes (
        user_id
      )
    `,
      { count: 'exact' }
    )
    .eq('published', true);

  // Apply filters
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
  }

  if (category) {
    query = query.eq('blog_post_categories.category.slug', category);
  }

  if (filterUserId) {
    query = query.eq('user_id', filterUserId);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  // Execute query
  const { data: blogPosts, error, count } = await query;

  if (error) {
    console.error('Error fetching blog posts:', error);
    return createErrorResponse('Failed to fetch blog posts', 500);
  }

  // Transform data to match expected format
  const transformedPosts = blogPosts?.map((post) => ({
    ...post,
    categories: post.categories?.map((c: any) => c.category) || [],
    recipes: post.blog_post_recipes?.map((bpr: any) => bpr.recipes) || [],
    is_liked: post.blog_post_likes?.some((like: any) => like.user_id === userId) || false,
    likes_count: post.blog_post_likes?.length || 0,
  }));

  // Calculate pagination metadata
  const pagination = calculatePagination(page, limit, count || 0);

  return createSuccessResponse(transformedPosts, undefined, pagination);
});

/**
 * POST /api/blog
 * Create a new blog post
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = createAdminClient();
  const userId = getUserIdFromRequest(request);

  // Parse request body
  const body = await request.json();

  // Validate required fields
  const validation = validateRequiredFields(body, ['title', 'content']);

  if (!validation.valid) {
    return createErrorResponse('Validation failed', 400, validation.errors);
  }

  // Prepare blog post data
  const postData = {
    user_id: userId,
    title: body.title,
    content: body.content,
    excerpt: body.excerpt || '',
    featured_image_url: body.featured_image_url || null,
    published: body.published !== undefined ? body.published : false,
  };

  // Create blog post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .insert(postData)
    .select(
      `
      *,
      user:users!blog_posts_user_id_fkey (
        id,
        username,
        full_name,
        avatar_url
      )
    `
    )
    .single();

  if (error) {
    console.error('Error creating blog post:', error);
    return createErrorResponse('Failed to create blog post', 500);
  }

  // Add categories if provided
  if (body.category_ids && Array.isArray(body.category_ids) && body.category_ids.length > 0) {
    const categoryInserts = body.category_ids.map((categoryId: number) => ({
      blog_post_id: post.id,
      category_id: categoryId,
    }));

    const { error: categoryError } = await supabase
      .from('blog_post_categories')
      .insert(categoryInserts);
    
    if (categoryError) {
      // Best effort: log but don't fail the entire operation
      console.error('Error linking categories to blog post:', categoryError);
    }
  }

  // Add recipes if provided
  if (body.recipe_ids && Array.isArray(body.recipe_ids) && body.recipe_ids.length > 0) {
    const recipeInserts = body.recipe_ids.map((recipeId: number) => ({
      blog_post_id: post.id,
      recipe_id: recipeId,
    }));

    const { error: recipeError } = await supabase
      .from('blog_post_recipes')
      .insert(recipeInserts);
    
    if (recipeError) {
      // Best effort: log but don't fail the entire operation
      console.error('Error linking recipes to blog post:', recipeError);
    }
  }

  return createSuccessResponse(post, 'Blog post created successfully');
});
