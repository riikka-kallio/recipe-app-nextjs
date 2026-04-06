import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createSuccessResponse,
  createErrorResponse,
  getUserIdFromRequest,
  withErrorHandling,
} from '@/lib/apiHelpers';

/**
 * POST /api/upload/audio
 * Upload an audio file to Supabase Storage
 * Uses admin client to bypass RLS (for MVP with mock auth)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = createAdminClient();
  const userId = getUserIdFromRequest(request);

  // Parse form data
  const formData = await request.formData();
  const file = formData.get('audio') as File;

  if (!file) {
    return createErrorResponse('No audio file provided', 400);
  }

  // Validate file type
  const allowedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
  ];
  if (!allowedTypes.includes(file.type)) {
    return createErrorResponse(
      'Invalid file type. Only MP3, WAV, WebM, OGG, and MP4 audio are allowed',
      400
    );
  }

  // Validate file size (max 10MB for audio)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return createErrorResponse('File size exceeds 10MB limit', 400);
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('audio-recordings')
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading audio:', error);
    return createErrorResponse('Failed to upload audio', 500);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('audio-recordings').getPublicUrl(data.path);

  return createSuccessResponse(
    {
      url: publicUrl,
      path: data.path,
      filename: fileName,
    },
    'Audio uploaded successfully'
  );
});
