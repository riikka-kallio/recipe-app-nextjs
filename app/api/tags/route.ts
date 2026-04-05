import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '@/lib/apiHelpers';

/**
 * GET /api/tags
 * Get all tags, optionally filtered by category
 * Query params:
 * - category: Filter by category slug
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');

  let query = supabase.from('tags').select('*').order('name', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  const { data: tags, error } = await query;

  if (error) {
    console.error('Error fetching tags:', error);
    return createErrorResponse('Failed to fetch tags', 500);
  }

  return createSuccessResponse(tags);
});
