import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandling } from '@/lib/apiHelpers';
import { validateUrl } from '@/lib/utils/urlValidator';
import { aiService } from '@/lib/services/aiService';
import { createAdminClient } from '@/lib/supabase/admin';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const contentType = request.headers.get('content-type');

  let imageUrl: string;

  // Handle file upload
  if (contentType?.includes('multipart/form-data')) {
    const supabase = createAdminClient();
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return createErrorResponse('Image file is required', 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse('Invalid image type. Use JPEG, PNG, or WebP', 400);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return createErrorResponse('Image size exceeds 5MB limit', 400);
    }

    // Upload to Supabase temporarily
    const fileName = `temp/${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, buffer, { contentType: file.type });

    if (error) {
      console.error('Error uploading image:', error);
      return createErrorResponse('Failed to upload image', 500);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(data.path);

    imageUrl = publicUrl;
  } else {
    // Handle URL
    const body = await request.json();
    imageUrl = body.imageUrl;

    if (!imageUrl) {
      return createErrorResponse('Image URL is required', 400);
    }

    const validation = validateUrl(imageUrl);
    if (!validation.valid) {
      return createErrorResponse(validation.error || 'Invalid URL', 400);
    }
  }

  try {
    // Extract text from image using AI vision
    const text = await aiService.extractTextFromImage(imageUrl);

    if (!text || text.trim().length === 0) {
      return createErrorResponse('No text found in image', 400);
    }

    // Parse recipe from extracted text
    const recipe = await aiService.parseRecipeFromText(text);
    recipe.image_url = imageUrl;

    return createSuccessResponse(recipe, 'Recipe imported from image successfully');
  } catch (error: any) {
    console.error('Error importing from image:', error);
    return createErrorResponse(error.message || 'Failed to import image', 500);
  }
});
