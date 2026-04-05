import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  getPaginationParams,
  calculatePagination,
  getUserIdFromRequest,
  withErrorHandling,
} from '@/lib/apiHelpers';

/**
 * GET /api/users/[id]/recipes
 * Get all recipes by a specific user
 */
export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const currentUserId = getUserIdFromRequest(request);
    const params = await context.params;
    const targetUserId = params.id;

    // Get pagination params
    const { page, limit, offset } = getPaginationParams(searchParams);

    const { data: recipes, error, count } = await supabase
      .from('recipes')
      .select(
        `
        *,
        user:users!recipes_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        recipe_tags (
          tag:tags!recipe_tags_tag_id_fkey (
            id,
            name
          )
        ),
        likes:recipe_likes (
          user_id
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', targetUserId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user recipes:', error);
      return createErrorResponse('Failed to fetch user recipes', 500);
    }

    // Transform data
    const transformedRecipes = recipes?.map((recipe) => ({
      ...recipe,
      tags: recipe.recipe_tags?.map((rt: any) => rt.tag) || [],
      is_liked: recipe.likes?.some((like: any) => like.user_id === currentUserId) || false,
      likes_count: recipe.likes?.length || 0,
    }));

    // Calculate pagination
    const pagination = calculatePagination(page, limit, count || 0);

    return createSuccessResponse(transformedRecipes, undefined, pagination);
  }
);
