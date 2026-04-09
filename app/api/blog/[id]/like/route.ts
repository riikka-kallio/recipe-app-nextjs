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
 * POST /api/blog/[id]/like
 * Toggle like on a blog post
 */
export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const supabase = createAdminClient();
    const userId = getUserIdFromRequest(request);
    const params = await context.params;
    const postId = params.id;

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return createErrorResponse('Blog post not found', 404);
    }

    // Check if user already liked the post
    const { data: existingLike } = await supabase
      .from('blog_post_likes')
      .select('*')
      .eq('blog_post_id', postId)
      .eq('user_id', userId)
      .single();

    let isLiked: boolean;

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('blog_post_likes')
        .delete()
        .eq('blog_post_id', postId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unliking blog post:', error);
        return createErrorResponse('Failed to unlike blog post', 500);
      }

      isLiked = false;
    } else {
      // Like
      const { error } = await supabase.from('blog_post_likes').insert({
        blog_post_id: postId,
        user_id: userId,
      });

      if (error) {
        console.error('Error liking blog post:', error);
        return createErrorResponse('Failed to like blog post', 500);
      }

      isLiked = true;
    }

    return createSuccessResponse(
      { is_liked: isLiked },
      isLiked ? 'Blog post liked' : 'Blog post unliked'
    );
  }
);
