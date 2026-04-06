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
 * GET /api/recipes/trending
 * Get trending recipes (most liked in the past 30 days)
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const userId = getUserIdFromRequest(request);

  // Get pagination params
  const { page, limit, offset } = getPaginationParams(searchParams);

  // Calculate date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Query trending recipes (most likes in the past 30 days)
  const { data: recipes, error, count } = await supabase
    .from('recipes')
    .select(
      `
      *,
      user:users (
        id,
        username,
        full_name,
        avatar_url
      ),
      recipe_tags (
        tag:tags (
          id,
          name
        )
      ),
      likes (
        user_id,
        created_at
      )
    `,
      { count: 'exact' }
    )
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching trending recipes:', error);
    return createErrorResponse('Failed to fetch trending recipes', 500);
  }

  // Transform and sort by likes count
  const transformedRecipes = recipes
    ?.map((recipe) => ({
      ...recipe,
      tags: recipe.recipe_tags?.map((rt: any) => rt.tag) || [],
      is_liked: recipe.likes?.some((like: any) => like.user_id === userId) || false,
      likes_count: recipe.likes?.length || 0,
    }))
    .sort((a, b) => b.likes_count - a.likes_count);

  // Calculate pagination metadata
  const pagination = calculatePagination(page, limit, count || 0);

  return createSuccessResponse(transformedRecipes, undefined, pagination);
});
