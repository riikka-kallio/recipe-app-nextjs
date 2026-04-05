import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  getUserIdFromRequest,
  withErrorHandling,
} from '@/lib/apiHelpers';

/**
 * GET /api/users/me
 * Get current user profile
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();
  const userId = getUserIdFromRequest(request);

  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, email, full_name, avatar_url, bio, created_at')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return createErrorResponse('User not found', 404);
  }

  return createSuccessResponse(user);
});
