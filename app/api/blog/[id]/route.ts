import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createSuccessResponse,
  createErrorResponse,
  getUserIdFromRequest,
  withErrorHandling,
} from '@/lib/apiHelpers';

// TODO: Phase 7 - Replace createAdminClient with proper auth context
// This route currently uses admin client to bypass RLS during MVP phase (Phases 2-6)

/**
 * GET /api/blog/[id]
 * Get a single blog post by ID
 */
export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const supabase = createAdminClient();
    const userId = getUserIdFromRequest(request);
    const params = await context.params;
    const postId = params.id;

    const { data: post, error } = await supabase
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
      `
      )
      .eq('id', postId)
      .single();

    if (error || !post) {
      return createErrorResponse('Blog post not found', 404);
    }

    // Increment view count
    await supabase.rpc('increment_blog_post_views', { post_id: postId });

    // Transform data to match expected format
    const transformedPost = {
      ...post,
      view_count: (post.view_count || 0) + 1, // Optimistically increment
      categories: post.categories?.map((c: any) => c.category) || [],
      recipes: post.blog_post_recipes?.map((bpr: any) => bpr.recipes) || [],
      is_liked: post.blog_post_likes?.some((like: any) => like.user_id === userId) || false,
      likes_count: post.blog_post_likes?.length || 0,
    };

    return createSuccessResponse(transformedPost);
  }
);

/**
 * PUT /api/blog/[id]
 * Update a blog post by ID
 */
export const PUT = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const supabase = createAdminClient();
    const userId = getUserIdFromRequest(request);
    const params = await context.params;
    const postId = params.id;

    // Parse request body
    const body = await request.json();

    // Validate allowed fields
    const allowedFields = ['title', 'content', 'excerpt', 'featured_image_url', 'published', 'category_ids', 'recipe_ids'];

    // Build updates object (exclude junction table fields)
    const updates: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined && !['category_ids', 'recipe_ids'].includes(field)) {
        updates[field] = body[field];
      }
    }

    // Check if post exists and user owns it
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!existingPost) {
      return createErrorResponse('Blog post not found', 404);
    }

    if (existingPost.user_id !== userId) {
      return createErrorResponse('Unauthorized to update this blog post', 403);
    }

    // Handle category updates
    if (body.category_ids !== undefined) {
      // Delete existing categories
      await supabase
        .from('blog_post_categories')
        .delete()
        .eq('blog_post_id', postId);
      
      // Insert new categories
      if (Array.isArray(body.category_ids) && body.category_ids.length > 0) {
        const categoryInserts = body.category_ids.map((categoryId: number) => ({
          blog_post_id: parseInt(postId),
          category_id: categoryId,
        }));
        
        const { error: categoryError } = await supabase
          .from('blog_post_categories')
          .insert(categoryInserts);
        
        if (categoryError) {
          console.error('Error updating categories:', categoryError);
        }
      }
    }

    // Handle recipe updates
    if (body.recipe_ids !== undefined) {
      // Delete existing recipe links
      await supabase
        .from('blog_post_recipes')
        .delete()
        .eq('blog_post_id', postId);
      
      // Insert new recipe links
      if (Array.isArray(body.recipe_ids) && body.recipe_ids.length > 0) {
        const recipeInserts = body.recipe_ids.map((recipeId: number) => ({
          blog_post_id: parseInt(postId),
          recipe_id: recipeId,
        }));
        
        const { error: recipeError } = await supabase
          .from('blog_post_recipes')
          .insert(recipeInserts);
        
        if (recipeError) {
          console.error('Error updating recipe links:', recipeError);
        }
      }
    }

    // Update blog post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', postId)
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
        )
      `
      )
      .single();

    if (error) {
      console.error('Error updating blog post:', error);
      return createErrorResponse('Failed to update blog post', 500);
    }

    // Transform data
    const transformedPost = {
      ...post,
      categories: post.categories?.map((c: any) => c.category) || [],
      recipes: post.blog_post_recipes?.map((bpr: any) => bpr.recipes) || [],
    };

    return createSuccessResponse(transformedPost, 'Blog post updated successfully');
  }
);

/**
 * DELETE /api/blog/[id]
 * Delete a blog post by ID
 */
export const DELETE = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const supabase = createAdminClient();
    const userId = getUserIdFromRequest(request);
    const params = await context.params;
    const postId = params.id;

    // Check if post exists and user owns it
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!existingPost) {
      return createErrorResponse('Blog post not found', 404);
    }

    if (existingPost.user_id !== userId) {
      return createErrorResponse('Unauthorized to delete this blog post', 403);
    }

    // Delete blog post
    const { error } = await supabase.from('blog_posts').delete().eq('id', postId);

    if (error) {
      console.error('Error deleting blog post:', error);
      return createErrorResponse('Failed to delete blog post', 500);
    }

    return createSuccessResponse(null, 'Blog post deleted successfully');
  }
);
