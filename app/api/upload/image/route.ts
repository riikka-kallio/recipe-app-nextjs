import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createSuccessResponse,
  createErrorResponse,
  getUserIdFromRequest,
  withErrorHandling,
} from '@/lib/apiHelpers';

/**
 * POST /api/upload/image
 * Upload an image to Supabase Storage
 * Uses admin client to bypass RLS (for MVP with mock auth)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = createAdminClient();
  const userId = getUserIdFromRequest(request);

  // Parse form data
  const formData = await request.formData();
  const file = formData.get('image') as File;

  if (!file) {
    return createErrorResponse('No image file provided', 400);
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return createErrorResponse(
      'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed',
      400
    );
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return createErrorResponse('File size exceeds 5MB limit', 400);
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('recipe-images')
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading image:', error);
    return createErrorResponse('Failed to upload image', 500);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('recipe-images').getPublicUrl(data.path);

  return createSuccessResponse(
    {
      url: publicUrl,
      path: data.path,
      filename: fileName,
    },
    'Image uploaded successfully'
  );
});
