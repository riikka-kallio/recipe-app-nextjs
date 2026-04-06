import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '@/lib/apiHelpers';

/**
 * GET /api/categories
 * Get all categories
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return createErrorResponse('Failed to fetch categories', 500);
  }

  return createSuccessResponse(categories);
});
