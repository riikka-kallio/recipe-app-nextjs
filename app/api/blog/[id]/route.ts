import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  getUserIdFromRequest,
  withErrorHandling,
} from '@/lib/apiHelpers';

/**
 * GET /api/blog/[id]
 * Get a single blog post by ID
 */
export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const supabase = await createClient();
    const userId = getUserIdFromRequest(request);
    const params = await context.params;
    const postId = params.id;

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(
        `
        *,
        user:users (
          id,
          username,
          full_name,
          avatar_url
        ),
        categories:blog_post_categories (
          category:blog_categories (
            id,
            name,
            slug
          )
        ),
        likes:blog_post_likes (
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
      is_liked: post.likes?.some((like: any) => like.user_id === userId) || false,
      likes_count: post.likes?.length || 0,
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
    const supabase = await createClient();
    const userId = getUserIdFromRequest(request);
    const params = await context.params;
    const postId = params.id;

    // Parse request body
    const body = await request.json();

    // Validate allowed fields
    const allowedFields = ['title', 'content', 'excerpt', 'featured_image_url', 'published'];

    const updates: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
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

    // Update blog post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', postId)
      .select(
        `
        *,
        user:users (
          id,
          username,
          full_name,
          avatar_url
        ),
        categories:blog_post_categories (
          category:blog_categories (
            id,
            name,
            slug
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
    const supabase = await createClient();
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
