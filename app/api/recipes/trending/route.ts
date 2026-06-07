import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createSuccessResponse,
  createErrorResponse,
  getPaginationParams,
  calculatePagination,
  getUserIdFromRequest,
  withErrorHandling,
} from '@/lib/apiHelpers';

// TODO: Phase 7 - Replace createAdminClient with proper auth context
// This route currently uses admin client to bypass RLS during MVP phase (Phases 2-6)

/**
 * GET /api/recipes/trending
 * Get trending recipes (most liked in the past 30 days)
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = createAdminClient();
  const searchParams = request.nextUrl.searchParams;
  const userId = getUserIdFromRequest(request);

  // Get pagination params
  const { page, limit, offset } = getPaginationParams(searchParams);

  // Calculate date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // First, try to get trending recipes (recipes with likes in the past 30 days)
  const { data: trendingRecipes, error: trendingError } = await supabase
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
    `
    )
    .order('created_at', { ascending: false });

  if (trendingError) {
    console.error('Error fetching trending recipes:', trendingError);
    return createErrorResponse('Failed to fetch trending recipes', 500);
  }

  // Transform recipes and calculate recent likes count
  const transformedRecipes = trendingRecipes
    ?.map((recipe) => {
      const allLikes = recipe.likes || [];
      const recentLikes = allLikes.filter(
        (like: any) => new Date(like.created_at) >= thirtyDaysAgo
      );
      
      return {
        ...recipe,
        tags: recipe.recipe_tags?.map((rt: any) => rt.tag) || [],
        is_liked: allLikes.some((like: any) => like.user_id === userId) || false,
        likes_count: allLikes.length || 0,
        recent_likes_count: recentLikes.length,
      };
    }) || [];

  // Sort by recent likes first (trending), then by all-time likes (popular)
  const sortedRecipes = transformedRecipes.sort((a, b) => {
    // Primary sort: recent likes (trending)
    if (b.recent_likes_count !== a.recent_likes_count) {
      return b.recent_likes_count - a.recent_likes_count;
    }
    // Secondary sort: all-time likes (popular)
    return b.likes_count - a.likes_count;
  });

  // Apply pagination
  const paginatedRecipes = sortedRecipes.slice(offset, offset + limit);
  const total = sortedRecipes.length;

  // Calculate pagination metadata
  const pagination = calculatePagination(page, limit, total);

  return createSuccessResponse(paginatedRecipes, undefined, pagination);
});
