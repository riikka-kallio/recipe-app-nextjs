import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
  const supabase = createAdminClient();
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

  // Group tags by category for easier frontend consumption
  const grouped = tags?.reduce((acc: Record<string, any[]>, tag: any) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {}) || {};

  return createSuccessResponse({
    all: tags || [],
    grouped: grouped,
  });
});
