import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandling } from '@/lib/apiHelpers';
import { validateUrl } from '@/lib/utils/urlValidator';
import { schemaParser } from '@/lib/parsers/schemaParser';
import { aiService } from '@/lib/services/aiService';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { url } = body;

  if (!url) {
    return createErrorResponse('URL is required', 400);
  }

  // Validate URL
  const validation = validateUrl(url);
  if (!validation.valid) {
    return createErrorResponse(validation.error || 'Invalid URL', 400);
  }

  try {
    // Fetch URL content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RecipeApp/1.0 (Recipe Import Feature)',
      },
    });

    if (!response.ok) {
      return createErrorResponse(`Failed to fetch URL: ${response.statusText}`, 400);
    }

    const html = await response.text();

    // Try schema parser first (free and fast)
    let recipe = await schemaParser.parseFromHTML(html);

    // If no structured data found, or if data is incomplete, use AI parsing
    if (!recipe || !recipe.ingredients.length || !recipe.instructions.length) {
      console.log('No complete structured data found, using AI parsing...');
      recipe = await aiService.parseRecipeFromText(html);
      recipe.source_url = url;
    }

    return createSuccessResponse(recipe, 'Recipe imported successfully');
  } catch (error: any) {
    console.error('Error importing from URL:', error);
    return createErrorResponse(error.message || 'Failed to import recipe', 500);
  }
});
