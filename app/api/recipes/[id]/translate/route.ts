import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse, withErrorHandling } from '@/lib/apiHelpers';
import { translationService } from '@/lib/services/translationService';
import { SUPPORTED_LANGUAGES } from '@/lib/types/translation';

// In-memory cache for translations (5-minute TTL)
const translationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// In-memory rate limiting (100 translations per month per user)
const rateLimitStore = new Map<string, { count: number; resetDate: Date }>();
const RATE_LIMIT_MAX = 100;

function getRateLimitKey(userId: string): string {
  return `translation:${userId}`;
}

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetDate: Date } {
  const key = getRateLimitKey(userId);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let limitData = rateLimitStore.get(key);

  // Reset if it's a new month
  if (!limitData || limitData.resetDate < now) {
    const resetDate = new Date(currentYear, currentMonth + 1, 1); // First day of next month
    limitData = { count: 0, resetDate };
    rateLimitStore.set(key, limitData);
  }

  const allowed = limitData.count < RATE_LIMIT_MAX;
  const remaining = Math.max(0, RATE_LIMIT_MAX - limitData.count);

  if (allowed) {
    limitData.count++;
    rateLimitStore.set(key, limitData);
  }

  return { allowed, remaining, resetDate: limitData.resetDate };
}

function getCacheKey(recipeId: number, targetLanguage: string, sourceLanguage: string): string {
  return `${recipeId}:${sourceLanguage}:${targetLanguage}`;
}

function getCachedTranslation(cacheKey: string): any | null {
  const cached = translationCache.get(cacheKey);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    translationCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function setCachedTranslation(cacheKey: string, data: any): void {
  translationCache.set(cacheKey, { data, timestamp: Date.now() });
  
  // Clean up old cache entries (simple cleanup)
  if (translationCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of translationCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        translationCache.delete(key);
      }
    }
  }
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return createErrorResponse('Unauthorized', 401);
  }

  // Get recipe ID from URL
  const url = new URL(request.url);
  const recipeId = parseInt(url.pathname.split('/')[3]);

  if (!recipeId || isNaN(recipeId)) {
    return createErrorResponse('Invalid recipe ID', 400);
  }

  // Parse request body
  const body = await request.json();
  const { target_language, source_language = 'en' } = body;

  if (!target_language) {
    return createErrorResponse('Target language is required', 400);
  }

  // Validate language codes
  const validLanguages = SUPPORTED_LANGUAGES.map(lang => lang.code);
  if (!validLanguages.includes(target_language)) {
    return createErrorResponse(`Unsupported target language: ${target_language}`, 400);
  }
  if (!validLanguages.includes(source_language)) {
    return createErrorResponse(`Unsupported source language: ${source_language}`, 400);
  }

  // Check rate limit
  const rateLimit = checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    return createErrorResponse(
      `Translation limit exceeded. You have ${rateLimit.remaining} translations remaining this month. Resets on ${rateLimit.resetDate.toLocaleDateString()}.`,
      429
    );
  }

  // Check cache first
  const cacheKey = getCacheKey(recipeId, target_language, source_language);
  const cached = getCachedTranslation(cacheKey);
  if (cached) {
    return createSuccessResponse(
      { ...cached, cached: true, remaining_translations: rateLimit.remaining - 1 },
      'Translation retrieved from cache'
    );
  }

  try {
    // Fetch recipe from database
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select(`
        *,
        user:users(id, username, email),
        ingredients(*),
        instructions(*),
        tags:recipe_tags(tag:tags(*))
      `)
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return createErrorResponse('Recipe not found', 404);
    }

    // Flatten tags structure
    const flattenedRecipe = {
      ...recipe,
      tags: recipe.tags?.map((rt: any) => rt.tag) || [],
    };

    // Translate recipe
    const translatedRecipe = await translationService.translateRecipe(
      flattenedRecipe,
      target_language,
      source_language
    );

    // Cache the result
    setCachedTranslation(cacheKey, translatedRecipe);

    return createSuccessResponse(
      { ...translatedRecipe, cached: false, remaining_translations: rateLimit.remaining - 1 },
      'Recipe translated successfully'
    );
  } catch (error: any) {
    console.error('Error translating recipe:', error);
    return createErrorResponse(
      error.message || 'Failed to translate recipe',
      500
    );
  }
});

// GET endpoint to check rate limit status
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return createErrorResponse('Unauthorized', 401);
  }

  const rateLimit = checkRateLimit(user.id);
  
  // Don't increment the count for GET requests
  const key = getRateLimitKey(user.id);
  const limitData = rateLimitStore.get(key);
  if (limitData && limitData.count > 0) {
    limitData.count--;
    rateLimitStore.set(key, limitData);
  }

  return createSuccessResponse({
    limit: RATE_LIMIT_MAX,
    remaining: rateLimit.remaining,
    reset_date: rateLimit.resetDate.toISOString(),
  });
});
