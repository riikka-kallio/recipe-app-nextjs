import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  getUserIdFromRequest,
  withErrorHandling,
} from '@/lib/apiHelpers';

/**
 * POST /api/recipes/[id]/like
 * Toggle like on a recipe
 */
export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const supabase = await createClient();
    const userId = getUserIdFromRequest(request);
    const params = await context.params;
    const recipeId = params.id;

    // Check if recipe exists
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return createErrorResponse('Recipe not found', 404);
    }

    // Check if user already liked the recipe
    const { data: existingLike } = await supabase
      .from('recipe_likes')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('user_id', userId)
      .single();

    let isLiked: boolean;

    if (existingLike) {
      // Unlike - remove the like
      const { error } = await supabase
        .from('recipe_likes')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unliking recipe:', error);
        return createErrorResponse('Failed to unlike recipe', 500);
      }

      isLiked = false;
    } else {
      // Like - add the like
      const { error } = await supabase.from('recipe_likes').insert({
        recipe_id: recipeId,
        user_id: userId,
      });

      if (error) {
        console.error('Error liking recipe:', error);
        return createErrorResponse('Failed to like recipe', 500);
      }

      isLiked = true;
    }

    return createSuccessResponse(
      { is_liked: isLiked },
      isLiked ? 'Recipe liked' : 'Recipe unliked'
    );
  }
);
