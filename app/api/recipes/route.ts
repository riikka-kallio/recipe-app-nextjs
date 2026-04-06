import { NextRequest } from 'next/server';
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

/**
 * GET /api/recipes
 * Get all recipes with optional filters and pagination
 * 
 * Query params:
 * - q: Search query (title, ingredients)
 * - tags: Comma-separated tag IDs
 * - difficulty: easy | medium | hard
 * - max_prep_time: Maximum prep time in minutes
 * - max_cook_time: Maximum cook time in minutes
 * - user_id: Filter by user UUID
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = createAdminClient();
  const searchParams = request.nextUrl.searchParams;
  const userId = getUserIdFromRequest(request);

  // Get pagination params
  const { page, limit, offset } = getPaginationParams(searchParams);

  // Get filter params
  const searchQuery = searchParams.get('q');
  const tags = searchParams.get('tags')?.split(',').filter(Boolean);
  const difficulty = searchParams.get('difficulty');
  const maxPrepTime = searchParams.get('max_prep_time');
  const maxCookTime = searchParams.get('max_cook_time');
  const filterUserId = searchParams.get('user_id');

  // Build the Supabase query
  let query = supabase
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
    `,
      { count: 'exact' }
    );

  // Apply filters
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,ingredients.cs.{${searchQuery}}`);
  }

  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }

  if (maxPrepTime) {
    query = query.lte('prep_time', parseInt(maxPrepTime));
  }

  if (maxCookTime) {
    query = query.lte('cook_time', parseInt(maxCookTime));
  }

  if (filterUserId) {
    query = query.eq('user_id', filterUserId);
  }

  if (tags && tags.length > 0) {
    query = query.in('recipe_tags.tag_id', tags);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  // Execute query
  const { data: recipes, error, count } = await query;

  if (error) {
    console.error('Error fetching recipes:', error);
    return createErrorResponse('Failed to fetch recipes', 500);
  }

  // Transform data to match expected format
  const transformedRecipes = recipes?.map((recipe) => ({
    ...recipe,
    tags: recipe.recipe_tags?.map((rt: any) => rt.tag) || [],
    is_liked: recipe.likes?.some((like: any) => like.user_id === userId) || false,
    likes_count: recipe.likes?.length || 0,
  }));

  // Calculate pagination metadata
  const pagination = calculatePagination(page, limit, count || 0);

  return createSuccessResponse(transformedRecipes, undefined, pagination);
});

/**
 * POST /api/recipes
 * Create a new recipe
 * 
 * Request body:
 * - title: string (required)
 * - description: string
 * - difficulty: 'easy' | 'medium' | 'hard' (required)
 * - prep_time: number (required)
 * - cook_time: number (required)
 * - servings: number (required)
 * - ingredients: string[] (required)
 * - instructions: string[] (required)
 * - image_url: string
 * - tags: string[] (tag IDs)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = createAdminClient();
  const userId = getUserIdFromRequest(request);

  // Parse request body
  const body = await request.json();

  // Validate required fields
  const validation = validateRequiredFields(body, [
    'title',
    'difficulty',
    'prep_time',
    'cook_time',
    'servings',
    'ingredients',
    'instructions',
  ]);

  if (!validation.valid) {
    return createErrorResponse('Validation failed', 400, validation.errors);
  }

  // Validate difficulty
  if (!['easy', 'medium', 'hard'].includes(body.difficulty)) {
    return createErrorResponse('Invalid difficulty level. Must be easy, medium, or hard', 400);
  }

  // Validate arrays
  if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
    return createErrorResponse('At least one ingredient is required', 400);
  }

  if (!Array.isArray(body.instructions) || body.instructions.length === 0) {
    return createErrorResponse('At least one instruction is required', 400);
  }

  // Prepare recipe data (ingredients and instructions will be inserted separately)
  const recipeData = {
    user_id: userId,
    title: body.title,
    description: body.description || '',
    difficulty: body.difficulty,
    prep_time: parseInt(body.prep_time),
    cook_time: parseInt(body.cook_time),
    servings: parseInt(body.servings),
    image_url: body.image_url || null,
  };

  // Create recipe
  const { data: recipe, error } = await supabase
    .from('recipes')
    .insert(recipeData)
    .select(
      `
      *,
      user:users!recipes_user_id_fkey (
        id,
        username,
        full_name,
        avatar_url
      )
    `
    )
    .single();

  if (error) {
    console.error('Error creating recipe:', error);
    return createErrorResponse('Failed to create recipe', 500);
  }

  // Insert ingredients into ingredients table
  if (body.ingredients && body.ingredients.length > 0) {
    const ingredientInserts = body.ingredients.map((ing: any, index: number) => ({
      recipe_id: recipe.id,
      item: ing.item,
      quantity: ing.quantity || null,
      unit: ing.unit || null,
      order_index: index,
      is_garnish: ing.is_garnish || false,
    }));

    const { error: ingredientsError } = await supabase
      .from('ingredients')
      .insert(ingredientInserts);

    if (ingredientsError) {
      console.error('Error inserting ingredients:', ingredientsError);
      // Continue - recipe was created successfully, ingredients can be added later
    }
  }

  // Insert instructions into instructions table
  if (body.instructions && body.instructions.length > 0) {
    const instructionInserts = body.instructions.map((inst: any, index: number) => ({
      recipe_id: recipe.id,
      step_number: index + 1,
      instruction: inst.instruction,
    }));

    const { error: instructionsError } = await supabase
      .from('instructions')
      .insert(instructionInserts);

    if (instructionsError) {
      console.error('Error inserting instructions:', instructionsError);
      // Continue - recipe was created successfully, instructions can be added later
    }
  }

  // Add tags if provided
  if (body.tags && Array.isArray(body.tags) && body.tags.length > 0) {
    const tagInserts = body.tags.map((tagId: string) => ({
      recipe_id: recipe.id,
      tag_id: tagId,
    }));

    const { error: tagsError } = await supabase.from('recipe_tags').insert(tagInserts);
    
    if (tagsError) {
      console.error('Error inserting tags:', tagsError);
      // Continue - recipe was created successfully, tags can be added later
    }
  }

  // Fetch the complete recipe with all relationships
  const { data: completeRecipe } = await supabase
    .from('recipes')
    .select(`
      *,
      user:users (
        id,
        username,
        full_name,
        avatar_url
      ),
      ingredients (*),
      instructions (*),
      recipe_tags (
        tag:tags (
          id,
          name,
          category
        )
      )
    `)
    .eq('id', recipe.id)
    .single();

  return createSuccessResponse(completeRecipe || recipe, 'Recipe created successfully');
});
