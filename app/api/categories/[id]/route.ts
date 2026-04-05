import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '@/lib/apiHelpers';

/**
 * GET /api/categories/[id]
 * Get a single category by ID
 */
export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const supabase = await createClient();
    const params = await context.params;
    const categoryId = params.id;

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error || !category) {
      return createErrorResponse('Category not found', 404);
    }

    return createSuccessResponse(category);
  }
);
