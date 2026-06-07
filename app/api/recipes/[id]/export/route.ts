import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createErrorResponse, withErrorHandling } from '@/lib/apiHelpers';
import { exportService } from '@/lib/services/exportService';
import type { ExportFormat } from '@/lib/types/import';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient();
  const searchParams = request.nextUrl.searchParams;
  const format = (searchParams.get('format') || 'json') as ExportFormat;

  // Validate format
  if (!['json', 'pdf', 'markdown'].includes(format)) {
    return createErrorResponse('Invalid format. Use json, pdf, or markdown', 400);
  }

  // Fetch recipe with all relations
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select(`
      *,
      user:users (
        id,
        username,
        full_name
      ),
      ingredients (*),
      instructions (*),
      recipe_tags (
        tag:tags (
          id,
          name
        )
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !recipe) {
    return createErrorResponse('Recipe not found', 404);
  }

  // Transform recipe data
  const transformedRecipe = {
    ...recipe,
    tags: recipe.recipe_tags?.map((rt: any) => rt.tag) || [],
  };

  const filename = exportService.getFilename(transformedRecipe, format);

  // Export based on format
  if (format === 'json') {
    const content = exportService.exportAsJSON(transformedRecipe);
    return new Response(content, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  if (format === 'markdown') {
    const content = exportService.exportAsMarkdown(transformedRecipe);
    return new Response(content, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  if (format === 'pdf') {
    // For now, use markdown format for PDF
    // TODO: Implement proper PDF generation with @react-pdf/renderer
    const content = exportService.exportAsMarkdown(transformedRecipe);
    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename.replace('.pdf', '.txt')}"`,
      },
    });
  }

  return createErrorResponse('Export format not implemented', 500);
}
