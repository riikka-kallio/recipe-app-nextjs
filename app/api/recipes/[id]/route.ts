import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  getUserIdFromRequest,
  validateRequiredFields,
  withErrorHandling,
} from '@/lib/apiHelpers';

/**
 * GET /api/recipes/[id]
 * Get a single recipe by ID
 */
export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const supabase = await createClient();
    const userId = getUserIdFromRequest(request);
    const params = await context.params;
    const recipeId = params.id;

    const { data: recipe, error } = await supabase
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
          user_id
        )
      `
      )
      .eq('id', recipeId)
      .single();

    if (error || !recipe) {
      return createErrorResponse('Recipe not found', 404);
    }

    // Transform data to match expected format
    const transformedRecipe = {
      ...recipe,
      tags: recipe.recipe_tags?.map((rt: any) => rt.tag) || [],
      is_liked: recipe.likes?.some((like: any) => like.user_id === userId) || false,
      likes_count: recipe.likes?.length || 0,
    };

    return createSuccessResponse(transformedRecipe);
  }
);

/**
 * PUT /api/recipes/[id]
 * Update a recipe by ID
 */
export const PUT = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const supabase = await createClient();
    const userId = getUserIdFromRequest(request);
    const params = await context.params;
    const recipeId = params.id;

    // Parse request body
    const body = await request.json();

    // Validate required fields (optional for update)
    const allowedFields = [
      'title',
      'description',
      'difficulty',
      'prep_time',
      'cook_time',
      'servings',
      'ingredients',
      'instructions',
      'image_url',
      'dietary_restrictions',
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Check if recipe exists and user owns it
    const { data: existingRecipe } = await supabase
      .from('recipes')
      .select('user_id')
      .eq('id', recipeId)
      .single();

    if (!existingRecipe) {
      return createErrorResponse('Recipe not found', 404);
    }

    if (existingRecipe.user_id !== userId) {
      return createErrorResponse('Unauthorized to update this recipe', 403);
    }

    // Update recipe
    const { data: recipe, error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', recipeId)
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
        )
      `
      )
      .single();

    if (error) {
      console.error('Error updating recipe:', error);
      return createErrorResponse('Failed to update recipe', 500);
    }

    // Transform data
    const transformedRecipe = {
      ...recipe,
      tags: recipe.recipe_tags?.map((rt: any) => rt.tag) || [],
    };

    return createSuccessResponse(transformedRecipe, 'Recipe updated successfully');
  }
);

/**
 * DELETE /api/recipes/[id]
 * Delete a recipe by ID
 */
export const DELETE = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const supabase = await createClient();
    const userId = getUserIdFromRequest(request);
    const params = await context.params;
    const recipeId = params.id;

    // Check if recipe exists and user owns it
    const { data: existingRecipe } = await supabase
      .from('recipes')
      .select('user_id')
      .eq('id', recipeId)
      .single();

    if (!existingRecipe) {
      return createErrorResponse('Recipe not found', 404);
    }

    if (existingRecipe.user_id !== userId) {
      return createErrorResponse('Unauthorized to delete this recipe', 403);
    }

    // Delete recipe (cascade will handle related records)
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId);

    if (error) {
      console.error('Error deleting recipe:', error);
      return createErrorResponse('Failed to delete recipe', 500);
    }

    return createSuccessResponse(null, 'Recipe deleted successfully');
  }
);
